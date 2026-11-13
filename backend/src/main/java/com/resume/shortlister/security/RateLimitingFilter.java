package com.resume.shortlister.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory fixed-window rate limiter.
 *
 * <p>Applies different limits based on request path:
 * <ul>
 *   <li>Auth endpoints: 5 requests per minute per IP</li>
 *   <li>Public candidate submission: 30 requests per minute per IP</li>
 *   <li>All other API endpoints: 100 requests per minute per IP</li>
 * </ul>
 *
 * <p>Note: For production deployments behind a load balancer, replace this
 * with a Redis-backed rate limiter to share counters across instances.</p>
 */
@Slf4j
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int WINDOW_SECONDS = 60;
    private static final int HTTP_TOO_MANY_REQUESTS = 429;

    private static final int AUTH_LIMIT = 5;
    private static final int CANDIDATE_SUBMIT_LIMIT = 30;
    private static final int GENERAL_LIMIT = 100;

    private final Map<String, WindowCounter> counters = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String ip = getClientIp(request);
        String path = request.getRequestURI();
        int limit = resolveLimit(path, request);

        String key = ip + ":" + path;
        WindowCounter counter = counters.computeIfAbsent(key, k -> new WindowCounter());

        Instant now = Instant.now();
        if (now.isAfter(counter.windowReset())) {
            counter.reset(now);
        }

        counter.increment();

        if (counter.count() > limit) {
            response.setStatus(HTTP_TOO_MANY_REQUESTS);
            response.setContentType("application/json");
            response.setHeader("Retry-After", String.valueOf(WINDOW_SECONDS));
            response.getWriter().write("""
                {
                  "timestamp": "%s",
                  "status": 429,
                  "error": "Too Many Requests",
                  "message": "Rate limit exceeded. Please try again later.",
                  "requestId": "%s",
                  "details": {}
                }
                """.formatted(Instant.now().toString(), java.util.UUID.randomUUID()));
            log.warn("Rate limit exceeded for ip={} path={}", ip, path);
            return;
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - counter.count())));

        filterChain.doFilter(request, response);
    }

    private int resolveLimit(String path, HttpServletRequest request) {
        if (path.contains("/auth/")) {
            return AUTH_LIMIT;
        }
        if (path.contains("/candidates") && "POST".equalsIgnoreCase(request.getMethod())) {
            return CANDIDATE_SUBMIT_LIMIT;
        }
        return GENERAL_LIMIT;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return request.getRemoteAddr();
    }

    private static final class WindowCounter {
        private int count = 0;
        private Instant windowStart;

        WindowCounter() {
            this.windowStart = Instant.now().plusSeconds(WINDOW_SECONDS);
        }

        void reset(Instant now) {
            this.count = 0;
            this.windowStart = now.plusSeconds(WINDOW_SECONDS);
        }

        Instant windowReset() {
            return windowStart;
        }

        void increment() {
            this.count++;
        }

        int count() {
            return count;
        }
    }
}
