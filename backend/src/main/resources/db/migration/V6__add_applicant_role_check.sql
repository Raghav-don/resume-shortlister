-- V6: Add APPLICANT role to recruiter_roles check constraint
ALTER TABLE recruiter_roles DROP CONSTRAINT recruiter_roles_role_check;
ALTER TABLE recruiter_roles ADD CONSTRAINT recruiter_roles_role_check
    CHECK (role IN ('RECRUITER', 'ADMIN', 'APPLICANT'));
