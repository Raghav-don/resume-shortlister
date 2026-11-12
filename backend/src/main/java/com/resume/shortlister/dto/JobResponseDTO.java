package com.resume.shortlister.dto;

import com.resume.shortlister.domain.Job;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class JobResponseDTO {

    private UUID id;
    private String title;
    private String jobDescription;
    private String eligibilityCriteria;
    private List<String> preferredTechnicalSkills;
    private Job.EmploymentType employmentType;
    private Job.RemoteWorkMode workMode;
    private String officeLocation;
    private Job.CandidateLevel candidateLevel;
    private Integer minExperienceYears;
    private Integer minExperienceMonths;
    private Integer maxExperienceYears;
    private Integer maxExperienceMonths;
    private String educationRequirement;
    private String department;
    private List<String> perksAndBenefits;
    private List<String> hiringProcess;
    private Integer salaryMin;
    private Integer salaryMax;
    private String salaryCurrency;
    private Job.SalaryPeriod salaryPeriod;
    private Boolean hideSalary;
    private LocalDate applicationDeadline;
    private String contactEmail;
    private String applicationUrl;
    private Job.JobStatus status;
    private String postedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
