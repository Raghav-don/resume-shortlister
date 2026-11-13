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
import jakarta.validation.constraints.Email;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "candidates", indexes = {
    @Index(name = "idx_candidate_email", columnList = "email", unique = true),
    @Index(name = "idx_candidate_experience", columnList = "yearsOfExperience"),
    @Index(name = "idx_candidate_location", columnList = "location"),
    @Index(name = "idx_candidate_status", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank @Size(max = 100)
    @Column(nullable = false)
    private String fullName;

    @NotBlank @Email @Size(max = 150)
    @Column(nullable = false, unique = true)
    private String email;

    @Size(max = 20)
    private String phone;

    @NotNull
    @Column(name = "years_of_experience", nullable = false)
    private Integer yearsOfExperience;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "candidate_skills", joinColumns = @JoinColumn(name = "candidate_id"))
    @Column(name = "skill")
    @Builder.Default
    private List<@NotBlank @Size(max = 50) String> technicalSkills = List.of();

    @NotBlank @Size(max = 100)
    @Column(nullable = false)
    private String location;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "remote_preference", nullable = false)
    private RemotePreference remotePreference;

    @NotBlank @Size(max = 50)
    @Column(name = "notice_period", nullable = false)
    private String noticePeriod;

    @NotNull
    @Column(name = "salary_expectation", nullable = false)
    private Integer salaryExpectation;

    @Column(name = "currency", length = 3)
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CandidateStatus status = CandidateStatus.NEW;

    @Column(name = "recruiter_notes", columnDefinition = "TEXT")
    private String recruiterNotes;

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

    public enum RemotePreference {
        ON_SITE, HYBRID, REMOTE
    }

    public enum CandidateStatus {
        NEW, SHORTLISTED, REVIEWED, REJECTED, CONTACTED, INTERVIEWING, HIRED
    }
}