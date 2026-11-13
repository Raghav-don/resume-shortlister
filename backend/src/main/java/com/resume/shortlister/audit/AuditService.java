package com.resume.shortlister.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Value("${app.security.trusted-proxies:}")
    private String trustedProxies;

    private final Set<String> trustedProxySet = new HashSet<>();

    @jakarta.annotation.PostConstruct
    public void init() {
        if (trustedProxies != null && !trustedProxies.isBlank()) {
            Arrays.stream(trustedProxies.split("\\s*,\\s*"))
                  .filter(p -> !p.isBlank())
                  .forEach(trustedProxySet::add);
        }
        // Always trust localhost in development
        trustedProxySet.add("127.0.0.1");
        trustedProxySet.add("0:0:0:0:0:0:0:1");
    }

    @Async("auditExecutor")
    @Transactional
    public void log(AuditLogParams params) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .action(params.getAction().name())
                    .userEmail(params.getUserEmail())
                    .userId(params.getUserId())
                    .entityType(params.getEntityType())
                    .entityId(params.getEntityId())
                    .ipAddress(getClientIp(params.getRequest()))
                    .userAgent(params.getRequest() != null ? params.getRequest().getHeader("User-Agent") : null)
                    .requestId(params.getRequest() != null ? params.getRequest().getHeader("X-Request-ID") : null)
                    .success(params.isSuccess())
                    .errorMessage(params.getErrorMessage())
                    .details(params.getDetails())
                    .build();

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage(), e);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String remoteAddr = request.getRemoteAddr();
        String xForwardedFor = request.getHeader("X-Forwarded-For");

        // Only trust X-Forwarded-For when the immediate connection comes from a trusted proxy.
        // This prevents IP spoofing by clients sending forged X-Forwarded-For headers.
        if (xForwardedFor != null && !xForwardedFor.isEmpty()
                && (trustedProxySet.contains(remoteAddr) || trustedProxySet.isEmpty())) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()
                && (trustedProxySet.contains(remoteAddr) || trustedProxySet.isEmpty())) {
            return xRealIp;
        }

        return remoteAddr;
    }
}