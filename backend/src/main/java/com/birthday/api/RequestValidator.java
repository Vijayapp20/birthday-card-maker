package com.birthday.api.validation;

import com.birthday.api.dto.CardRequest;
import com.birthday.api.dto.MessageRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Central input validation + sanitising for everything the public API accepts.
 * Every failure throws IllegalArgumentException with a user-safe message; the controller
 * turns that into a 400 response.
 */
@Component
public class RequestValidator {

    private static final int MAX_NAME = 50;
    private static final int MAX_RELATIONSHIP = 40;   // DB column is VARCHAR(100)
    private static final int MAX_OCCASION = 40;       // DB column is VARCHAR(50)
    private static final int MAX_MESSAGE = 1000;
    private static final int MAX_URL = 500;           // DB column is VARCHAR(500)

    private static final Set<String> TEMPLATES = Set.of("photo", "giftbox", "letter");

    private static final Pattern KEY = Pattern.compile("^[A-Za-z0-9_-]{1,50}$");
    private static final Pattern CARD_ID = Pattern.compile("^[0-9a-fA-F-]{36}$");
    private static final Pattern CONTROL_CHARS = Pattern.compile("\\p{Cc}");
    private static final Pattern WHITESPACE_RUN = Pattern.compile("\\s+");
    private static final Pattern URL_BAD_CHARS = Pattern.compile("[\\s<>\"'\\\\]");

    private final String cloudinaryPrefix;

    public RequestValidator(@Value("${cloudinary.cloud-name}") String cloudName) {
        this.cloudinaryPrefix = "https://res.cloudinary.com/" + cloudName + "/";
    }

    public MessageRequest validate(MessageRequest req) {
        if (req == null) throw new IllegalArgumentException("Request body is required.");
        return new MessageRequest(
                singleLine(req.recipientName(), "Recipient name", MAX_NAME, true),
                singleLine(req.senderName(), "Your name", MAX_NAME, true),
                singleLine(req.relationship(), "Relationship", MAX_RELATIONSHIP, true),
                singleLine(req.occasionType(), "Occasion", MAX_OCCASION, false)
        );
    }

    public CardRequest validate(CardRequest req) {
        if (req == null) throw new IllegalArgumentException("Request body is required.");

        req.setRecipientName(singleLine(req.getRecipientName(), "Recipient name", MAX_NAME, true));
        req.setSenderName(singleLine(req.getSenderName(), "Your name", MAX_NAME, true));
        req.setRelationship(singleLine(req.getRelationship(), "Relationship", MAX_RELATIONSHIP, true));
        req.setOccasionType(singleLine(req.getOccasionType(), "Occasion", MAX_OCCASION, false));
        req.setMessage(multiLine(req.getMessage(), "Message", MAX_MESSAGE));
        req.setPhotoUrl(cloudinaryUrl(req.getPhotoUrl()));

        String gif = req.getCharacterGif();
        if (gif != null && !gif.isBlank()) {
            if (!KEY.matcher(gif.trim()).matches()) throw new IllegalArgumentException("Invalid character.");
            req.setCharacterGif(gif.trim());
        } else {
            req.setCharacterGif(null);
        }

        String template = req.getTemplate();
        if (template != null && !template.isBlank()) {
            if (!TEMPLATES.contains(template.trim())) throw new IllegalArgumentException("Invalid template.");
            req.setTemplate(template.trim());
        } else {
            req.setTemplate(null);
        }
        return req;
    }

    /** Shared card ids are UUIDs; anything else can be rejected without touching the database. */
    public boolean isValidCardId(String id) {
        return id != null && CARD_ID.matcher(id).matches();
    }

    // ── helpers ────────────────────────────────────────────────────────────

    /** Names, relationship, occasion: one line, no control characters, no angle brackets. */
    private String singleLine(String value, String field, int maxLen, boolean required) {
        if (value == null) {
            if (required) throw new IllegalArgumentException(field + " is required.");
            return null;
        }
        String v = CONTROL_CHARS.matcher(value).replaceAll(" ");
        v = WHITESPACE_RUN.matcher(v).replaceAll(" ").trim();
        v = v.replace("<", "").replace(">", "");
        if (v.isEmpty()) {
            if (required) throw new IllegalArgumentException(field + " is required.");
            return null;
        }
        if (v.length() > maxLen) {
            throw new IllegalArgumentException(field + " must be at most " + maxLen + " characters.");
        }
        return v;
    }

    /** Custom / AI message: line breaks are allowed, other control characters are removed. */
    private String multiLine(String value, String field, int maxLen) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(field + " is required.");
        StringBuilder sb = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '\n' || c == '\r' || c == '\t' || !Character.isISOControl(c)) {
                sb.append(c);
            }
        }
        String v = sb.toString().replace("<", "").replace(">", "").trim();
        if (v.isEmpty()) throw new IllegalArgumentException(field + " is required.");
        if (v.length() > maxLen) {
            throw new IllegalArgumentException(field + " must be at most " + maxLen + " characters.");
        }
        return v;
    }

    /** Only photos hosted on OUR Cloudinary account are accepted. */
    private String cloudinaryUrl(String url) {
        if (url == null || url.isBlank()) return null;
        String v = url.trim();
        if (v.length() > MAX_URL
                || !v.startsWith(cloudinaryPrefix)
                || URL_BAD_CHARS.matcher(v).find()) {
            throw new IllegalArgumentException("Invalid photo URL.");
        }
        return v;
    }
}
