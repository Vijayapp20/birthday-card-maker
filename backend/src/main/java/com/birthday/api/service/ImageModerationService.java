package com.birthday.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Base64;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Blocks adult (18+) and graphic/bloody photos before they are stored.
 * Asks a Groq vision model to classify the photo (same GROQ_API_KEY as the AI messages).
 *
 * Fails CLOSED: if the check cannot be completed, the upload is refused (IllegalStateException →
 * generic "try again" message) rather than letting an unchecked photo through.
 * Emergency switch: set MODERATION_ENABLED=false on Render to turn the check off.
 */
@Service
public class ImageModerationService {

    private static final Logger log = LoggerFactory.getLogger(ImageModerationService.class);

    /** The photo is shrunk before the check — faster, cheaper and well under Groq's 4 MB base64 limit. */
    private static final int MAX_SIDE = 768;
    private static final int MAX_RAW_BYTES = 3 * 1024 * 1024;

    static final String UNSAFE_MESSAGE =
            "This photo can't be used. Please choose a different photo (no adult or graphic/bloody content).";

    private static final String PROMPT = """
            You are an image safety checker for a greeting-card website where people upload photos of \
            family and friends. Look at the image and reply with JSON only, in exactly this shape: \
            {"adult": true or false, "graphic": true or false}.
            "adult" = true if the image shows nudity, sexual or pornographic content, or sexually \
            explicit material (exposed genitals, breasts or nipples, sexual acts).
            "graphic" = true if the image shows real blood, open wounds, gore, dead bodies, severe \
            injuries or graphic violence.
            Ordinary photos are false: people in everyday clothes, swimwear at a beach or pool, babies, \
            festivals, food, red paint, red clothing, ketchup, movie-style makeup that is clearly not real.
            Reply with the JSON object only.""";

    private final boolean enabled;
    private final String apiKey;
    private final String url;
    private final String model;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    public ImageModerationService(@Value("${moderation.enabled:true}") boolean enabled,
                                  @Value("${spring.ai.openai.api-key}") String apiKey,
                                  @Value("${moderation.url:https://api.groq.com/openai/v1/chat/completions}") String url,
                                  @Value("${moderation.model:qwen/qwen3.8-27b}") String model) {
        this.enabled = enabled;
        this.apiKey = apiKey;
        this.url = url;
        this.model = model;
    }

    /**
     * @throws IllegalArgumentException if the photo is adult/graphic (shown to the user as-is)
     * @throws IllegalStateException    if the check could not be completed (upload is refused)
     */
    public void assertSafe(byte[] bytes, String mimeType) {
        if (!enabled) {
            return;
        }
        Prepared image = prepare(bytes, mimeType);
        String dataUrl = "data:" + image.mime() + ";base64," + Base64.getEncoder().encodeToString(image.bytes());

        boolean adult;
        boolean graphic;
        try {
            JsonNode verdict = classify(dataUrl);
            if (!verdict.has("adult") || !verdict.has("graphic")) {
                throw new IllegalStateException("Moderation reply missing fields");
            }
            adult = verdict.get("adult").asBoolean(true);
            graphic = verdict.get("graphic").asBoolean(true);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalStateException("Photo moderation failed: " + e.getMessage(), e);
        }

        log.info("Photo moderation verdict - adult: {}, graphic: {}", adult, graphic);
        if (adult || graphic) {
            throw new IllegalArgumentException(UNSAFE_MESSAGE);
        }
    }

    // ── Groq call ───────────────────────────────────────────────────

    private JsonNode classify(String dataUrl) throws IOException, InterruptedException {
        // First try with reasoning switched off + JSON mode; if the model rejects those options (HTTP 400),
        // retry with a plain request so a model change on Groq's side doesn't break uploads.
        HttpResponse<String> res = send(dataUrl, true);
        if (res.statusCode() == 400) {
            log.warn("Moderation model rejected tuned options (400), retrying plain request");
            res = send(dataUrl, false);
        }
        if (res.statusCode() / 100 != 2) {
            throw new IllegalStateException("Groq moderation HTTP " + res.statusCode() + ": " + abbreviate(res.body()));
        }
        String content = mapper.readTree(res.body()).path("choices").path(0).path("message").path("content").asText("");
        return parseVerdict(content);
    }

    private HttpResponse<String> send(String dataUrl, boolean tuned) throws IOException, InterruptedException {
        Map<String, Object> textPart = new LinkedHashMap<>();
        textPart.put("type", "text");
        textPart.put("text", PROMPT);
        Map<String, Object> imagePart = new LinkedHashMap<>();
        imagePart.put("type", "image_url");
        imagePart.put("image_url", Map.of("url", dataUrl));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", List.of(Map.of("role", "user", "content", List.of(textPart, imagePart))));
        body.put("temperature", 0);
        body.put("max_tokens", 2000);
        if (tuned) {
            body.put("reasoning_effort", "none");
            body.put("response_format", Map.of("type", "json_object"));
        }

        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(25))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                .build();
        return http.send(request, HttpResponse.BodyHandlers.ofString());
    }

    /** Pulls the {...} verdict out of the model's text (ignores any <think> block or stray words around it). */
    JsonNode parseVerdict(String content) throws IOException {
        String text = content.replaceAll("(?s)<think>.*?</think>", "").trim();
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start < 0 || end <= start) {
            throw new IllegalStateException("Moderation reply was not JSON");
        }
        return mapper.readTree(text.substring(start, end + 1));
    }

    // ── Image shrinking ─────────────────────────────────────────────

    record Prepared(byte[] bytes, String mime) {
    }

    /** Shrinks to ~768px JPEG. WebP (not readable by plain ImageIO) is sent as-is when small enough. */
    Prepared prepare(byte[] bytes, String mime) {
        try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = in == null ? null : ImageIO.getImageReaders(in);
            if (readers != null && readers.hasNext()) {
                ImageReader reader = readers.next();
                try {
                    reader.setInput(in, true, true);
                    int w = reader.getWidth(0);
                    int h = reader.getHeight(0);
                    // Subsample while decoding so a 6000px photo never has to be fully held in memory.
                    int step = Math.max(1, Math.max(w, h) / MAX_SIDE);
                    ImageReadParam param = reader.getDefaultReadParam();
                    param.setSourceSubsampling(step, step, 0, 0);
                    BufferedImage decoded = reader.read(0, param);
                    return new Prepared(toJpeg(decoded), "image/jpeg");
                } finally {
                    reader.dispose();
                }
            }
        } catch (IOException | RuntimeException e) {
            log.warn("Could not decode photo for moderation ({}), trying raw bytes", e.getClass().getSimpleName());
        }
        if (bytes.length <= MAX_RAW_BYTES) {
            return new Prepared(bytes, mime);
        }
        throw new IllegalArgumentException("Photo is too large to check. Please choose a smaller JPG or PNG photo.");
    }

    private byte[] toJpeg(BufferedImage src) throws IOException {
        int w = src.getWidth();
        int h = src.getHeight();
        double scale = Math.min(1.0, (double) MAX_SIDE / Math.max(w, h));
        int nw = Math.max(1, (int) Math.round(w * scale));
        int nh = Math.max(1, (int) Math.round(h * scale));

        BufferedImage rgb = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgb.createGraphics();
        try {
            g.setColor(Color.WHITE); // PNG transparency → white instead of black
            g.fillRect(0, 0, nw, nh);
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.drawImage(src, 0, 0, nw, nh, null);
        } finally {
            g.dispose();
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        if (!ImageIO.write(rgb, "jpg", out)) {
            throw new IOException("No JPEG writer available");
        }
        return out.toByteArray();
    }

    private static String abbreviate(String s) {
        if (s == null) return "";
        return s.length() > 300 ? s.substring(0, 300) + "..." : s;
    }
}
