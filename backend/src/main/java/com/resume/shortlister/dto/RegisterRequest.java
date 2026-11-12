package com.resume.shortlister.dto;

import com.resume.shortlister.domain.Recruiter;
import jakarta.validation.constraints.*;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RegisterRequest {

    @NotBlank @Size(max = 100)
    private String fullName;

    @NotBlank @Email @Size(max = 150)
    private String email;

    @NotBlank @Size(min = 8, max = 100)
    private String password;

    @Builder.Default
    private Recruiter.Role role = Recruiter.Role.RECRUITER;
}
