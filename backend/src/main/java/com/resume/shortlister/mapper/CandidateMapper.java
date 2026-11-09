package com.resume.shortlister.mapper;

import com.resume.shortlister.domain.Candidate;
import com.resume.shortlister.dto.CandidateRequestDTO;
import com.resume.shortlister.dto.CandidateResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface CandidateMapper {
    CandidateMapper INSTANCE = Mappers.getMapper(CandidateMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "status", constant = "NEW")
    Candidate toEntity(CandidateRequestDTO dto);

    CandidateResponseDTO toResponseDTO(Candidate entity);
}