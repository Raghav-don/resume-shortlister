import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, setAuthToken, candidateApi, authApi } from '../lib/api';
import { server } from '../mocks/handlers';
import { setupServer } from 'msw/node';

const mswServer = setupServer(...server);

beforeEach(() => {
  mswServer.listen({ onUnhandledRequest: 'error' });
  localStorage.clear();
});

afterEach(() => {
  mswServer.resetHandlers();
  mswServer.close();
});

describe('api client', () => {
  test('sets auth token on headers', () => {
    setAuthToken('test-token');
    expect(api.defaults.headers.common.Authorization).toBe('Bearer test-token');
  });

  test('clears auth token', () => {
    setAuthToken('test-token');
    setAuthToken(null);
    expect(api.defaults.headers.common.Authorization).toBeUndefined();
  });
});

describe('authApi', () => {
  test('login returns token and user', async () => {
    const response = await authApi.login({ email: 'test@example.com', password: 'password123' });

    expect(response.data).toHaveProperty('accessToken');
    expect(response.data).toHaveProperty('recruiter');
    expect(response.data.recruiter.email).toBe('test@example.com');
  });

  test('login fails with invalid credentials', async () => {
    await expect(
      authApi.login({ email: 'wrong@example.com', password: 'wrong' })
    ).rejects.toThrow();
  });

  test('register creates new user', async () => {
    const response = await authApi.register({
      fullName: 'New User',
      email: 'new@example.com',
      password: 'password123',
    });

    expect(response.data).toHaveProperty('accessToken');
    expect(response.data.recruiter.email).toBe('new@example.com');
  });
});

describe('candidateApi', () => {
  test('creates candidate', async () => {
    const candidate = {
      fullName: 'John Doe',
      email: 'john@example.com',
      yearsOfExperience: 5,
      technicalSkills: ['React', 'TypeScript'],
      location: 'San Francisco',
      remotePreference: 'REMOTE' as const,
      noticePeriod: '30 days',
      salaryExpectation: 150000,
    };

    const response = await candidateApi.create(candidate);

    expect(response.data).toHaveProperty('id');
    expect(response.data.fullName).toBe('John Doe');
    expect(response.data.status).toBe('NEW');
  });

  test('lists candidates with pagination', async () => {
    const response = await candidateApi.list({ page: 0, size: 10 });

    expect(response.data).toHaveProperty('content');
    expect(response.data).toHaveProperty('totalElements');
    expect(response.data).toHaveProperty('totalPages');
    expect(Array.isArray(response.data.content)).toBe(true);
  });

  test('filters candidates by status', async () => {
    const response = await candidateApi.list({ status: 'SHORTLISTED' });

    expect(response.data.content.every(c => c.status === 'SHORTLISTED')).toBe(true);
  });

  test('filters candidates by skills', async () => {
    const response = await candidateApi.list({ skills: 'React' });

    expect(response.data.content.every(c =>
      c.technicalSkills.some(s => s.toLowerCase().includes('react'))
    )).toBe(true);
  });

  test('gets candidate by id', async () => {
    const listResponse = await candidateApi.list({ page: 0, size: 1 });
    const candidateId = listResponse.data.content[0].id;

    const response = await candidateApi.get(candidateId);

    expect(response.data.id).toBe(candidateId);
  });

  test('updates candidate status', async () => {
    const listResponse = await candidateApi.list({ page: 0, size: 1 });
    const candidateId = listResponse.data.content[0].id;

    const response = await candidateApi.updateStatus(candidateId, 'SHORTLISTED', 'Great candidate');

    expect(response.data.status).toBe('SHORTLISTED');
    expect(response.data.recruiterNotes).toBe('Great candidate');
  });

  test('gets stats', async () => {
    const response = await candidateApi.getStats();

    expect(response.data).toHaveProperty('NEW');
    expect(response.data).toHaveProperty('SHORTLISTED');
    expect(typeof response.data.NEW).toBe('number');
  });

  test('deletes candidate', async () => {
    const listResponse = await candidateApi.list({ page: 0, size: 1 });
    const candidateId = listResponse.data.content[0].id;

    await candidateApi.delete(candidateId);

    const newList = await candidateApi.list({ page: 0, size: 10 });
    expect(newList.data.content.find(c => c.id === candidateId)).toBeUndefined();
  });
});