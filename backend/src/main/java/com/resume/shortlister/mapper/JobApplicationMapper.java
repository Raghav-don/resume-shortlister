package com.resume.shortlister.mapper;

import com.resume.shortlister.domain.JobApplication;
import com.resume.shortlister.domain.Job;
import com.resume.shortlister.dto.JobApplicationRequest;
import com.resume.shortlister.dto.JobApplicationResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface JobApplicationMapper {

    JobApplicationMapper INSTANCE = Mappers.getMapper(JobApplicationMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "appliedAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    JobApplication toEntity(JobApplicationRequest dto);

    JobApplicationResponse toResponseDTO(JobApplication entity);

    default String mapJobTitle(Job job) {
        return job != null ? job.getTitle() : null;
    }
}
