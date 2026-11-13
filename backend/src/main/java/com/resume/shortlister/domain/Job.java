package com.resume.shortlister.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "jobs", indexes = {
    @Index(name = "idx_job_title", columnList = "title"),
    @Index(name = "idx_job_status", columnList = "status"),
    @Index(name = "idx_job_posted_by", columnList = "posted_by"),
    @Index(name = "idx_job_created_at", columnList = "created_at")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank @Size(max = 150)
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(name = "job_description", columnDefinition = "TEXT", nullable = false)
    private String jobDescription;

    @NotBlank
    @Column(name = "eligibility_criteria", columnDefinition = "TEXT", nullable = false)
    private String eligibilityCriteria;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_preferred_skills", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "skill")
    @Builder.Default
    private List<@NotBlank @Size(max = 50) String> preferredTechnicalSkills = List.of();

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false)
    private EmploymentType employmentType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "work_mode", nullable = false)
    private RemoteWorkMode workMode;

    @Size(max = 100)
    @Column(name = "office_location")
    private String officeLocation;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "candidate_level", nullable = false)
    private CandidateLevel candidateLevel;

    @NotNull @Min(0) @Max(50)
    @Column(name = "min_experience_years", nullable = false)
    private Integer minExperienceYears;

    @NotNull @Min(0) @Max(11)
    @Column(name = "min_experience_months", nullable = false)
    private Integer minExperienceMonths;

    @Min(0) @Max(50)
    @Column(name = "max_experience_years")
    private Integer maxExperienceYears;

    @Min(0) @Max(11)
    @Column(name = "max_experience_months")
    private Integer maxExperienceMonths;

    @Size(max = 100)
    @Column(name = "education_requirement")
    private String educationRequirement;

    @Size(max = 100)
    @Column(name = "department")
    private String department;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_perks", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "perk")
    @Builder.Default
    private List<@NotBlank @Size(max = 100) String> perksAndBenefits = List.of();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_hiring_process", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "step")
    @Builder.Default
    private List<@NotBlank @Size(max = 200) String> hiringProcess = List.of();

    @Min(0)
    @Column(name = "salary_min")
    private Integer salaryMin;

    @Min(0)
    @Column(name = "salary_max")
    private Integer salaryMax;

    @Size(max = 3)
    @Column(name = "salary_currency")
    @Builder.Default
    private String salaryCurrency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(name = "salary_period")
    @Builder.Default
    private SalaryPeriod salaryPeriod = SalaryPeriod.ANNUAL;

    @Column(name = "hide_salary")
    @Builder.Default
    private Boolean hideSalary = false;

    @Column(name = "application_deadline")
    private LocalDate applicationDeadline;

    @Size(max = 150)
    @Column(name = "contact_email")
    private String contactEmail;

    @Size(max = 500)
    @Column(name = "application_url")
    private String applicationUrl;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private JobStatus status = JobStatus.ACTIVE;

    @Column(name = "posted_by", nullable = false)
    private String postedBy;

    @CreatedBy
    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @LastModifiedBy
    @Column(name = "updated_by")
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum EmploymentType {
        FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE
    }

    public enum RemoteWorkMode {
        ON_SITE, HYBRID, REMOTE
    }

    public enum CandidateLevel {
        FRESHER, EXPERIENCED, BOTH
    }

    public enum SalaryPeriod {
        ANNUAL, MONTHLY
    }

    public enum JobStatus {
        DRAFT, ACTIVE, CLOSED, ARCHIVED
    }
}
