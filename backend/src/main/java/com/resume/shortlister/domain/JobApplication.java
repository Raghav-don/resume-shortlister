package com.resume.shortlister.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "job_applications", indexes = {
    @Index(name = "idx_job_application_job", columnList = "job_id"),
    @Index(name = "idx_job_application_applicant", columnList = "applicant_id"),
    @Index(name = "idx_job_application_status", columnList = "status"),
    @Index(name = "idx_job_application_email", columnList = "email"),
    @Index(name = "idx_job_application_created", columnList = "applied_at")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @NotNull
    @Column(name = "applicant_id", nullable = false)
    private UUID applicantId;

    @NotBlank @Size(max = 100)
    @Column(nullable = false)
    private String fullName;

    @NotBlank @Email @Size(max = 150)
    @Column(nullable = false)
    private String email;

    @Size(max = 20)
    @Column(name = "phone")
    private String phone;

    @Size(max = 500)
    @Column(name = "resume_url")
    private String resumeUrl;

    @Size(max = 500)
    @Column(name = "resume_file_name")
    private String resumeFileName;

    @Size(max = 500)
    @Column(name = "portfolio_url")
    private String portfolioUrl;

    @Size(max = 500)
    @Column(name = "github_url")
    private String githubUrl;

    @Size(max = 500)
    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @NotBlank @Size(max = 200)
    @Column(name = "current_location", nullable = false)
    private String currentLocation;

    @Size(max = 100)
    @Column(name = "work_authorization")
    private String workAuthorization;

    @NotNull @Min(0) @Max(50)
    @Column(name = "years_of_experience", nullable = false)
    private Integer yearsOfExperience;

    @NotBlank @Size(max = 50)
    @Column(name = "notice_period", nullable = false)
    private String noticePeriod;

    @Size(max = 1000)
    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_application_skills", joinColumns = @JoinColumn(name = "job_application_id"))
    @Column(name = "skill")
    @Builder.Default
    private List<@NotBlank @Size(max = 50) String> technicalSkills = List.of();

    @Enumerated(EnumType.STRING)
    @Column(name = "remote_preference")
    private Job.RemoteWorkMode remotePreference;

    @Min(0)
    @Column(name = "salary_expectation")
    private Integer salaryExpectation;

    @Size(max = 3)
    @Column(name = "currency")
    @Builder.Default
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @CreationTimestamp
    @Column(name = "applied_at", nullable = false, updatable = false)
    private LocalDateTime appliedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum ApplicationStatus {
        PENDING, REVIEWED, SHORTLISTED, REJECTED, HIRED
    }
}
