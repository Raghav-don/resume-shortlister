-- V1: Create initial schema for Resume Shortlister

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Recruiters table
CREATE TABLE recruiters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Recruiter roles (element collection)
CREATE TABLE recruiter_roles (
    recruiter_id UUID NOT NULL REFERENCES recruiters(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('RECRUITER', 'ADMIN')),
    PRIMARY KEY (recruiter_id, role)
);

-- Candidates table
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    years_of_experience INTEGER NOT NULL CHECK (years_of_experience >= 0 AND years_of_experience <= 50),
    location VARCHAR(100) NOT NULL,
    remote_preference VARCHAR(20) NOT NULL CHECK (remote_preference IN ('ON_SITE', 'HYBRID', 'REMOTE')),
    notice_period VARCHAR(50) NOT NULL,
    salary_expectation INTEGER NOT NULL CHECK (salary_expectation >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    resume_url VARCHAR(500),
    portfolio_url VARCHAR(200),
    linkedin_url VARCHAR(200),
    github_url VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'SHORTLISTED', 'REJECTED', 'CONTACTED', 'INTERVIEWING', 'HIRED')),
    recruiter_notes TEXT,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Candidate skills (element collection)
CREATE TABLE candidate_skills (
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    skill VARCHAR(50) NOT NULL,
    PRIMARY KEY (candidate_id, skill)
);

-- Indexes for performance
CREATE INDEX idx_candidates_experience ON candidates(years_of_experience);
CREATE INDEX idx_candidates_location ON candidates(location);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_remote_preference ON candidates(remote_preference);
CREATE INDEX idx_candidates_salary ON candidates(salary_expectation);
CREATE INDEX idx_candidates_created_at ON candidates(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
CREATE TRIGGER update_recruiters_updated_at
    BEFORE UPDATE ON recruiters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();