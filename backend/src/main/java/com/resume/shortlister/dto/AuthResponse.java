package com.resume.shortlister.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private Long expiresIn;
    private RecruiterInfo recruiter;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RecruiterInfo {
        private java.util.UUID id;
        private String fullName;
        private String email;
        private List<String> roles;
    }
}