package com.resume.shortlister.dto;

import com.resume.shortlister.domain.Candidate;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CandidateResponseDTO {

    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private Integer yearsOfExperience;
    private List<String> technicalSkills;
    private String location;
    private Candidate.RemotePreference remotePreference;
    private String noticePeriod;
    private Integer salaryExpectation;
    private String currency;
    private String resumeUrl;
    private String portfolioUrl;
    private String linkedinUrl;
    private String githubUrl;
    private Candidate.CandidateStatus status;
    private String recruiterNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}