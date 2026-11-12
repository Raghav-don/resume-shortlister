import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let accessToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Authentication required. Please log in again.'));
    }

    if (error.response?.status === 403) {
      return Promise.reject(new Error('You do not have permission to perform this action.'));
    }

    if (error.response?.status === 404) {
      return Promise.reject(new Error('The requested resource was not found.'));
    }

    if (error.response?.status === 409) {
      return Promise.reject(new Error('This action conflicts with the current state. Please try again.'));
    }

    if (error.response?.status === 422) {
      return Promise.reject(new Error('Invalid request data. Please check your inputs.'));
    }

    if (error.response?.status === 429) {
      return Promise.reject(new Error('Too many requests. Please slow down and try again later.'));
    }

    if (error.response?.status === 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    if (!error.response) {
      return Promise.reject(
        new Error('Network error. Please check your connection and try again.')
      );
    }

    const responseData = error.response.data as { message?: string } | undefined;
    const message = responseData?.message || error.response.statusText || 'An unexpected error occurred.';
    return Promise.reject(new Error(String(message)));
  }
);

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  yearsOfExperience: number;
  technicalSkills: string[];
  location: string;
  remotePreference: 'ON_SITE' | 'HYBRID' | 'REMOTE';
  noticePeriod: string;
  salaryExpectation: number;
  currency: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  status: 'NEW' | 'SHORTLISTED' | 'REVIEWED' | 'REJECTED' | 'CONTACTED' | 'INTERVIEWING' | 'HIRED';
  recruiterNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateRequest {
  fullName: string;
  email: string;
  phone?: string;
  yearsOfExperience: number;
  technicalSkills: string[];
  location: string;
  remotePreference: 'ON_SITE' | 'HYBRID' | 'REMOTE';
  noticePeriod: string;
  salaryExpectation: number;
  currency?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export interface CandidateFilters {
  minExperience?: number;
  maxExperience?: number;
  skills?: string;
  location?: string;
  remotePreference?: 'ON_SITE' | 'HYBRID' | 'REMOTE';
  noticePeriod?: string;
  maxSalary?: number;
  status?: Candidate['status'];
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  recruiter: {
    id: string;
    fullName: string;
    email: string;
    roles: string[];
  };
}

export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'REJECTED' | 'HIRED';

export type JobStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type JobEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE';
export type JobWorkMode = 'ON_SITE' | 'HYBRID' | 'REMOTE';
export type JobCandidateLevel = 'FRESHER' | 'EXPERIENCED' | 'BOTH';
export type JobSalaryPeriod = 'ANNUAL' | 'MONTHLY';

export interface Job {
  id: string;
  title: string;
  jobDescription: string;
  eligibilityCriteria: string;
  preferredTechnicalSkills: string[];
  employmentType: JobEmploymentType;
  workMode: JobWorkMode;
  officeLocation?: string;
  candidateLevel: JobCandidateLevel;
  minExperienceYears: number;
  minExperienceMonths: number;
  maxExperienceYears?: number;
  maxExperienceMonths?: number;
  educationRequirement?: string;
  department?: string;
  perksAndBenefits?: string[];
  hiringProcess?: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: JobSalaryPeriod;
  hideSalary?: boolean;
  applicationDeadline?: string;
  contactEmail?: string;
  applicationUrl?: string;
  status: JobStatus;
  postedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobRequest {
  title: string;
  jobDescription: string;
  eligibilityCriteria: string;
  preferredTechnicalSkills: string[];
  employmentType: JobEmploymentType;
  workMode: JobWorkMode;
  officeLocation?: string;
  candidateLevel: JobCandidateLevel;
  minExperienceYears: number;
  minExperienceMonths: number;
  maxExperienceYears?: number;
  maxExperienceMonths?: number;
  educationRequirement?: string;
  department?: string;
  perksAndBenefits?: string[];
  hiringProcess?: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: JobSalaryPeriod;
  hideSalary?: boolean;
  applicationDeadline?: string;
  contactEmail?: string;
  applicationUrl?: string;
  status?: JobStatus;
}

export interface JobFilters {
  title?: string;
  status?: JobStatus;
  candidateLevel?: JobCandidateLevel;
  employmentType?: JobEmploymentType;
  workMode?: JobWorkMode;
  applicationDeadline?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaginatedJobResponse {
  content: Job[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export const jobApi = {
  create: (data: JobRequest) =>
    api.post<Job>('/jobs', data),
  list: (filters: JobFilters = {}) =>
    api.get<PaginatedJobResponse>('/jobs', { params: filters }),
  myJobs: () =>
    api.get<Job[]>('/jobs/my'),
  get: (id: string) =>
    api.get<Job>(`/jobs/${id}`),
  update: (id: string, data: JobRequest) =>
    api.put<Job>(`/jobs/${id}`, data),
  updateStatus: (id: string, status: JobStatus) =>
    api.patch<Job>(`/jobs/${id}/status`, null, { params: { status } }),
  delete: (id: string) =>
    api.delete(`/jobs/${id}`),
  getStats: () =>
    api.get<Record<JobStatus, number>>('/jobs/stats/count-by-status'),
};

export const authApi = {
  register: (data: { fullName: string; email: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),
};

export const candidateApi = {
  create: (data: CandidateRequest) =>
    api.post<Candidate>('/candidates', data),
  list: (filters: CandidateFilters = {}) =>
    api.get<PaginatedResponse<Candidate>>('/candidates', { params: filters }),
  get: (id: string) =>
    api.get<Candidate>(`/candidates/${id}`),
  getByStatus: (status: Candidate['status']) =>
    api.get<Candidate[]>(`/candidates/status/${status}`),
  updateStatus: (id: string, status: Candidate['status'], recruiterNotes?: string) =>
    api.patch<Candidate>(`/candidates/${id}/status`, null, { params: { status, recruiterNotes } }),
  delete: (id: string) =>
    api.delete(`/candidates/${id}`),
  getStats: () =>
    api.get<Record<Candidate['status'], number>>('/candidates/stats/count-by-status'),
};

export interface JobApplicationRequest {
  jobId: string;
  fullName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  currentLocation: string;
  workAuthorization?: string;
  yearsOfExperience: number;
  noticePeriod: string;
  coverLetter?: string;
  technicalSkills?: string[];
  remotePreference?: string;
  salaryExpectation?: number;
  currency?: string;
}

export interface JobApplicationResponse {
  id: string;
  jobId: string;
  jobTitle?: string;
  applicantId: string;
  fullName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  currentLocation: string;
  workAuthorization?: string;
  yearsOfExperience: number;
  noticePeriod: string;
  coverLetter?: string;
  technicalSkills?: string[];
  remotePreference?: string;
  salaryExpectation?: number;
  currency?: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}

export const jobApplicationApi = {
  apply: (data: JobApplicationRequest, resume?: File) => {
    const formData = new FormData();
    formData.append(
      'request',
      new Blob([JSON.stringify(data)], { type: 'application/json' })
    );
    if (resume) {
      formData.append('resume', resume);
    }
    // Content-Type is intentionally left unset so the browser sets the
    // multipart boundary; this overrides the shared axios JSON header.
    return api.post<JobApplicationResponse>('/job-applications', formData, {
      headers: { 'Content-Type': undefined },
    });
  },
  my: (page = 0, size = 20, sortBy = 'appliedAt', sortDir = 'desc') =>
    api.get<PaginatedResponse<JobApplicationResponse>>('/job-applications/my', { params: { page, size, sortBy, sortDir } }),
  get: (id: string) =>
    api.get<JobApplicationResponse>(`/job-applications/${id}`),
  byJob: (jobId: string, page = 0, size = 20, sortBy = 'appliedAt', sortDir = 'desc') =>
    api.get<PaginatedResponse<JobApplicationResponse>>(`/job-applications/job/${jobId}`, { params: { page, size, sortBy, sortDir } }),
  updateStatus: (id: string, status: ApplicationStatus) =>
    api.patch<JobApplicationResponse>(`/job-applications/${id}/status`, null, { params: { status } }),
  withdraw: (id: string) =>
    api.delete(`/job-applications/${id}`),
  countByJob: (jobId: string) =>
    api.get<number>(`/job-applications/job/${jobId}/count`),
};