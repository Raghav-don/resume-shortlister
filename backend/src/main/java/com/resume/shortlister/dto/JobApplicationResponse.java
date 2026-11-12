package com.resume.shortlister.dto;

import com.resume.shortlister.domain.JobApplication;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class JobApplicationResponse {

    private UUID id;
    private UUID jobId;
    private String jobTitle;
    private UUID applicantId;
    private String fullName;
    private String email;
    private String phone;
    private String resumeUrl;
    private String portfolioUrl;
    private String githubUrl;
    private String linkedinUrl;
    private String currentLocation;
    private String workAuthorization;
    private Integer yearsOfExperience;
    private String noticePeriod;
    private String coverLetter;
    private List<String> technicalSkills;
    private String remotePreference;
    private Integer salaryExpectation;
    private String currency;
    private String resumeFileName;
    private JobApplication.ApplicationStatus status;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;
}
