package com.birthday.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Simple in-memory rate limiter (no extra dependency).
 *
 * Protects the public endpoints that cost money / quota (Groq AI, Cloudinary, MySQL):
 *  - a per-IP limit, so one visitor can't hammer the API
 *  - a global limit per endpoint, so the total daily quota can't be drained even if
 *    someone rotates IPs or spoofs the X-Forwarded-For header
 *
 * Limits are kept in memory, so they reset when the server restarts and are not shared
 * between multiple instances. That's fine for a single Render instance.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final long MINUTE = 60_000L;
    private static final long HOUR = 60 * MINUTE;

    /** perIp requests per windowMs for each IP; global requests per globalWindowMs in total (0 = no global cap). */
    private record Rule(String bucket, int perIp, long windowMs, int global, long globalWindowMs) {}

    private static final Rule GENERATE  = new Rule("generate",  10, 10 * MINUTE, 600, HOUR);
    private static final Rule UPLOAD    = new Rule("upload",    10, 10 * MINUTE, 300, HOUR);
    private static final Rule SAVE_CARD = new Rule("save-card", 20, 10 * MINUTE, 600, HOUR);
    private static final Rule VIEW_CARD = new Rule("view-card", 120, MINUTE, 0, 0);

    private static final class Window {
        long start;
        long expiresAt;
        int count;
    }

    private final Map<String, Window> windows = new HashMap<>();

    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (!enabled) {
            chain.doFilter(request, response);
            return;
        }

        Rule rule = ruleFor(request.getMethod(), request.getRequestURI());
        if (rule == null) {
            chain.doFilter(request, response);
            return;
        }

        long now = System.currentTimeMillis();
        String ip = clientIp(request);

        long waitMs = acquire("ip:" + rule.bucket() + ":" + ip, rule.perIp(), rule.windowMs(), now);
        if (waitMs == 0 && rule.global() > 0) {
            waitMs = acquire("global:" + rule.bucket(), rule.global(), rule.globalWindowMs(), now);
        }

        if (waitMs > 0) {
            log.warn("Rate limit hit on {} (bucket={})", request.getRequestURI(), rule.bucket());
            long retryAfterSeconds = Math.max(1, (waitMs + 999) / 1000);
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setContentType("application/json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(
                    "{\"error\":\"Too many requests. Please wait a few minutes and try again.\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    private Rule ruleFor(String method, String path) {
        if ("POST".equals(method)) {
            if ("/api/generate-message".equals(path)) return GENERATE;
            if ("/api/upload".equals(path))           return UPLOAD;
            if ("/api/cards".equals(path))            return SAVE_CARD;
        }
        if ("GET".equals(method) && path.startsWith("/api/cards/")) {
            return VIEW_CARD;
        }
        return null; // /api/health and everything else is not limited
    }

    /**
     * Returns 0 if the request is allowed, otherwise the number of milliseconds
     * until the current window resets.
     */
    private synchronized long acquire(String key, int max, long windowMs, long now) {
        if (windows.size() > 5000) {
            purgeExpired(now);
        }

        Window w = windows.get(key);
        if (w == null || now >= w.expiresAt) {
            w = new Window();
            w.start = now;
            w.expiresAt = now + windowMs;
            w.count = 0;
            windows.put(key, w);
        }

        if (w.count >= max) {
            return Math.max(1, w.expiresAt - now);
        }
        w.count++;
        return 0;
    }

    private void purgeExpired(long now) {
        Iterator<Map.Entry<String, Window>> it = windows.entrySet().iterator();
        while (it.hasNext()) {
            if (now >= it.next().getValue().expiresAt) {
                it.remove();
            }
        }
    }

    /**
     * Behind Render's proxy the real client IP is the first entry of X-Forwarded-For.
     * A client can fake this header, which is exactly why there is also a global cap above.
     */
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String first = forwarded.split(",")[0].trim();
            if (!first.isEmpty()) {
                return first.length() > 64 ? first.substring(0, 64) : first;
            }
        }
        return request.getRemoteAddr();
    }
}
