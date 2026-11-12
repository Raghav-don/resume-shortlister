package com.resume.shortlister.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class JobApplicationRequest {

    @NotNull
    private UUID jobId;

    @NotBlank @Size(max = 100)
    private String fullName;

    @NotBlank @Email @Size(max = 150)
    private String email;

    @Size(max = 20)
    private String phone;

    @Size(max = 500)
    private String resumeUrl;

    @Size(max = 500)
    private String resumeFileName;

    @Size(max = 500)
    private String portfolioUrl;

    @Size(max = 500)
    private String githubUrl;

    @Size(max = 500)
    private String linkedinUrl;

    @NotBlank @Size(max = 200)
    private String currentLocation;

    @Size(max = 100)
    private String workAuthorization;

    @NotNull @Min(0) @Max(50)
    private Integer yearsOfExperience;

    @NotBlank @Size(max = 50)
    private String noticePeriod;

    @Size(max = 1000)
    private String coverLetter;

    @Size(max = 30)
    private List<@NotBlank @Size(max = 50) String> technicalSkills;

    @Size(max = 20)
    private String remotePreference;

    @Min(0)
    private Integer salaryExpectation;

    @Size(max = 3)
    private String currency;
}
