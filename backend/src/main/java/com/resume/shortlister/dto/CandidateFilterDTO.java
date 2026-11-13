package com.resume.shortlister.dto;

import com.resume.shortlister.domain.Candidate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CandidateFilterDTO {
    private Integer minExperience;
    private Integer maxExperience;
    private String skills; // comma-separated
    private String location;
    private Candidate.RemotePreference remotePreference;
    private String noticePeriod;
    private Integer maxSalary;
    private Candidate.CandidateStatus status;
    private int page = 0;
    private int size = DEFAULT_PAGE_SIZE;
    private String sortBy = "createdAt";
    private String sortDir = "desc";

    private static final int DEFAULT_PAGE_SIZE = 20;

    public List<String> getSkillList() {
        if (skills == null || skills.isBlank()) {
            return List.of();
        }
        return List.of(skills.split("\\s*,\\s*"));
    }
}