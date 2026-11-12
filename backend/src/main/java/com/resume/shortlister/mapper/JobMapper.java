package com.resume.shortlister.mapper;

import com.resume.shortlister.domain.Job;
import com.resume.shortlister.dto.JobRequestDTO;
import com.resume.shortlister.dto.JobResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface JobMapper {

    JobMapper INSTANCE = Mappers.getMapper(JobMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "postedBy", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Job toEntity(JobRequestDTO dto);

    JobResponseDTO toResponseDTO(Job entity);
}
