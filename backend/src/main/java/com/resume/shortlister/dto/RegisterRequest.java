package com.resume.shortlister.dto;

import com.resume.shortlister.domain.Recruiter;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
