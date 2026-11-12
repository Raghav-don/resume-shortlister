package com.resume.shortlister.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async("auditExecutor")
    @Transactional
    public void log(AuditLog.Action action, String userEmail, UUID userId, String entityType,
                    UUID entityId, HttpServletRequest request, boolean success, String errorMessage, Map<String, Object> details) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .action(action.name())
                    .userEmail(userEmail)
                    .userId(userId)
                    .entityType(entityType)
                    .entityId(entityId)
                    .ipAddress(getClientIp(request))
                    .userAgent(request != null ? request.getHeader("User-Agent") : null)
                    .requestId(request != null ? request.getHeader("X-Request-ID") : null)
                    .success(success)
                    .errorMessage(errorMessage)
                    .details(details)
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage(), e);
        }
    }

    @Async("auditExecutor")
    @Transactional
    public void logSimple(AuditLog.Action action, String userEmail, String entityType, UUID entityId,
                          HttpServletRequest request, boolean success, String errorMessage) {
        log(action, userEmail, null, entityType, entityId, request, success, errorMessage, null);
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) return null;
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