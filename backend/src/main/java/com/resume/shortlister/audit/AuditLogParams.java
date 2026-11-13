package com.resume.shortlister.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLogParams {
    private AuditLog.Action action;
    private String userEmail;
    private UUID userId;
    private String entityType;
    private UUID entityId;
    private HttpServletRequest request;
    private boolean success;
    private String errorMessage;
    private Map<String, Object> details;
}
