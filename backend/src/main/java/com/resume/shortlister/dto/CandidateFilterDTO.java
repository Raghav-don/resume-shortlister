package com.resume.shortlister.dto;

import com.resume.shortlister.domain.Candidate;
import lombok.*;

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
    private int size = 20;
    private String sortBy = "createdAt";
    private String sortDir = "desc";

    public List<String> getSkillList() {
        if (skills == null || skills.isBlank()) return List.of();
        return List.of(skills.split("\\s*,\\s*"));
    }
}