package com.resume.shortlister.dto;

import com.resume.shortlister.domain.Candidate;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CandidateRequestDTO {

    @NotBlank @Size(max = 100)
    private String fullName;

    @NotBlank @Email @Size(max = 150)
    private String email;

    @Size(max = 20)
    private String phone;

    @NotNull @Min(0) @Max(50)
    private Integer yearsOfExperience;

    @NotEmpty
    @Size(max = 30)
    private List<@NotBlank @Size(max = 50) String> technicalSkills;

    @NotBlank @Size(max = 100)
    private String location;

    @NotNull
    private Candidate.RemotePreference remotePreference;

    @NotBlank @Size(max = 50)
    private String noticePeriod;

    @NotNull @Min(0)
    private Integer salaryExpectation;

    @Size(max = 3)
    @Builder.Default
    private String currency = "USD";

    @Size(max = 500)
    private String resumeUrl;

    @Size(max = 200)
    private String portfolioUrl;

    @Size(max = 200)
    private String linkedinUrl;

    @Size(max = 200)
    private String githubUrl;
}