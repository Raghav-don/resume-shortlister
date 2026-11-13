package com.resume.shortlister.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Generates or propagates a correlation/request ID for every request.
 *
 * <p>If the client sends an {@code X-Request-ID} header, that value is used.
 * Otherwise a new UUID is generated. The ID is returned in the
 * {@code X-Request-ID} response header so clients can correlate logs.</p>
 */
@Component
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-ID";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        // Make the request ID available to downstream components
        request.setAttribute(REQUEST_ID_HEADER, requestId);

        response.setHeader(REQUEST_ID_HEADER, requestId);

        filterChain.doFilter(request, response);
    }
}
