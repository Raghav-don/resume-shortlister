package com.resume.shortlister.security;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final Bucket authRateLimitBucket;
    private final Bucket apiRateLimitBucket;
    private final Bucket publicRateLimitBucket;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        Bucket bucket = selectBucket(path);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        // Add rate limit headers
        response.addHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
        response.addHeader("X-RateLimit-Limit", String.valueOf(getBucketCapacity(bucket)));

        if (!probe.isConsumed()) {
            Duration waitTime = probe.getNanosToWaitForRefill() > 0
                ? Duration.ofNanos(probe.getNanosToWaitForRefill())
                : Duration.ofMinutes(1);

            response.addHeader("Retry-After", String.valueOf(waitTime.getSeconds()));
            response.setStatus(HttpServletResponse.SC_TOO_MANY_REQUESTS);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again later.\"}");
            log.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, path);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Bucket selectBucket(String path) {
        if (path.startsWith("/api/auth/")) {
            return authRateLimitBucket;
        } else if (path.startsWith("/api/candidates") && "POST".equals(path)) {
            return publicRateLimitBucket;
        } else if (path.startsWith("/api/")) {
            return apiRateLimitBucket;
        }
        return apiRateLimitBucket;
    }

    private long getBucketCapacity(Bucket bucket) {
        return bucket.getAvailableTokens();
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}