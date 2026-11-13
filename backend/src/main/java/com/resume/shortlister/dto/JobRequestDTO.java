package com.resume.shortlister.dto;

import com.resume.shortlister.domain.Job;
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

import java.time.LocalDate;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class JobRequestDTO {

    @NotBlank @Size(max = 150)
    private String title;

    @NotBlank
    private String jobDescription;

    @NotBlank
    private String eligibilityCriteria;

    @NotEmpty
    @Size(max = 30)
    private List<@NotBlank @Size(max = 50) String> preferredTechnicalSkills;

    @NotNull
    private Job.EmploymentType employmentType;

    @NotNull
    private Job.RemoteWorkMode workMode;

    @Size(max = 100)
    private String officeLocation;

    @NotNull
    private Job.CandidateLevel candidateLevel;

    @NotNull @Min(0) @Max(50)
    private Integer minExperienceYears;

    @NotNull @Min(0) @Max(11)
    private Integer minExperienceMonths;

    @Min(0) @Max(50)
    private Integer maxExperienceYears;

    @Min(0) @Max(11)
    private Integer maxExperienceMonths;

    @Size(max = 100)
    private String educationRequirement;

    @Size(max = 100)
    private String department;

    @Size(max = 20)
    private List<@NotBlank @Size(max = 100) String> perksAndBenefits;

    @Size(max = 10)
    private List<@NotBlank @Size(max = 200) String> hiringProcess;

    @Min(0)
    private Integer salaryMin;

    @Min(0)
    private Integer salaryMax;

    @Size(max = 3)
    private String salaryCurrency;

    private Job.SalaryPeriod salaryPeriod;

    private Boolean hideSalary;

    private LocalDate applicationDeadline;

    @Size(max = 150)
    private String contactEmail;

    @Size(max = 500)
    private String applicationUrl;

    private Job.JobStatus status;
}
