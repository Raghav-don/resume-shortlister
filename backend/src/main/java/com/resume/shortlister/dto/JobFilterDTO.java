package com.resume.shortlister.dto;

import com.resume.shortlister.domain.Job;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class JobFilterDTO {
    private String title;
    private Job.JobStatus status;
    private Job.CandidateLevel candidateLevel;
    private Job.EmploymentType employmentType;
    private Job.RemoteWorkMode workMode;
    private LocalDate applicationDeadline;
    private int page = 0;
    private int size = DEFAULT_PAGE_SIZE;
    private String sortBy = "createdAt";
    private String sortDir = "desc";

    private static final int DEFAULT_PAGE_SIZE = 20;
}
