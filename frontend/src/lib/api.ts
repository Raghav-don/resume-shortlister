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
      window.location.href = '/login';
    }
    return Promise.reject(error);
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
  status: 'NEW' | 'SHORTLISTED' | 'REJECTED' | 'CONTACTED' | 'INTERVIEWING' | 'HIRED';
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