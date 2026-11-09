import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';

// Mock data
const mockCandidates = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    yearsOfExperience: 5,
    technicalSkills: ['React', 'TypeScript', 'Node.js'],
    location: 'San Francisco, CA',
    remotePreference: 'REMOTE',
    noticePeriod: '30 days',
    salaryExpectation: 150000,
    currency: 'USD',
    resumeUrl: 'https://example.com/resume.pdf',
    portfolioUrl: 'https://johndoe.dev',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    githubUrl: 'https://github.com/johndoe',
    status: 'NEW',
    recruiterNotes: '',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1-555-0456',
    yearsOfExperience: 8,
    technicalSkills: ['Java', 'Spring Boot', 'PostgreSQL'],
    location: 'New York, NY',
    remotePreference: 'HYBRID',
    noticePeriod: '60 days',
    salaryExpectation: 180000,
    currency: 'USD',
    resumeUrl: '',
    portfolioUrl: '',
    linkedinUrl: 'https://linkedin.com/in/janesmith',
    githubUrl: '',
    status: 'SHORTLISTED',
    recruiterNotes: 'Great backend experience',
    createdAt: '2024-01-14T09:00:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
  },
];

let candidates = [...mockCandidates];
let nextId = 3;

const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        accessToken: 'mock-jwt-token',
        tokenType: 'Bearer',
        expiresIn: 86400,
        recruiter: {
          id: '1',
          fullName: 'Test User',
          email: 'test@example.com',
          roles: ['RECRUITER'],
        },
      });
    }
    return HttpResponse.json(
      { error: 'Unauthorized', message: 'Invalid email or password' },
      { status: 401 }
    );
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      accessToken: 'mock-jwt-token',
      tokenType: 'Bearer',
      expiresIn: 86400,
      recruiter: {
        id: String(nextId++),
        fullName: body.fullName,
        email: body.email,
        roles: ['RECRUITER'],
      },
    });
  }),

  // Candidate endpoints
  http.get('/api/candidates', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const size = parseInt(url.searchParams.get('size') || '20');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortDir = url.searchParams.get('sortDir') || 'desc';

    let filtered = [...candidates];

    // Apply filters
    const minExp = url.searchParams.get('minExperience');
    if (minExp) filtered = filtered.filter(c => c.yearsOfExperience >= parseInt(minExp));

    const maxExp = url.searchParams.get('maxExperience');
    if (maxExp) filtered = filtered.filter(c => c.yearsOfExperience <= parseInt(maxExp));

    const skills = url.searchParams.get('skills');
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim().toLowerCase());
      filtered = filtered.filter(c => c.technicalSkills.some(s => skillList.includes(s.toLowerCase())));
    }

    const location = url.searchParams.get('location');
    if (location) filtered = filtered.filter(c => c.location.toLowerCase().includes(location.toLowerCase()));

    const remote = url.searchParams.get('remotePreference');
    if (remote) filtered = filtered.filter(c => c.remotePreference === remote);

    const notice = url.searchParams.get('noticePeriod');
    if (notice) filtered = filtered.filter(c => c.noticePeriod === notice);

    const maxSalary = url.searchParams.get('maxSalary');
    if (maxSalary) filtered = filtered.filter(c => c.salaryExpectation <= parseInt(maxSalary));

    const status = url.searchParams.get('status');
    if (status) filtered = filtered.filter(c => c.status === status);

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof typeof a];
      const bVal = b[sortBy as keyof typeof b];
      const dir = sortDir === 'asc' ? 1 : -1;
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });

    const start = page * size;
    const end = start + size;
    const paginated = filtered.slice(start, end);

    return HttpResponse.json({
      content: paginated,
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      first: page === 0,
      last: end >= filtered.length,
    });
  }),

  http.post('/api/candidates', async ({ request }) => {
    const body = await request.json();
    const newCandidate = {
      ...body,
      id: String(nextId++),
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currency: body.currency || 'USD',
    };
    candidates.push(newCandidate);
    return HttpResponse.json(newCandidate, { status: 201 });
  }),

  http.get('/api/candidates/:id', ({ params }) => {
    const candidate = candidates.find(c => c.id === params.id);
    if (!candidate) {
      return HttpResponse.json({ error: 'Not Found', message: 'Candidate not found' }, { status: 404 });
    }
    return HttpResponse.json(candidate);
  }),

  http.patch('/api/candidates/:id/status', async ({ params, request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const notes = url.searchParams.get('recruiterNotes');

    const index = candidates.findIndex(c => c.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ error: 'Not Found', message: 'Candidate not found' }, { status: 404 });
    }

    candidates[index] = {
      ...candidates[index],
      status: status as any,
      recruiterNotes: notes || candidates[index].recruiterNotes,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(candidates[index]);
  }),

  http.delete('/api/candidates/:id', ({ params }) => {
    const index = candidates.findIndex(c => c.id === params.id);
    if (index === -1) {
      return HttpResponse.json({ error: 'Not Found', message: 'Candidate not found' }, { status: 404 });
    }
    candidates.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/candidates/stats/count-by-status', () => {
    const stats = {
      NEW: 0,
      SHORTLISTED: 0,
      REJECTED: 0,
      CONTACTED: 0,
      INTERVIEWING: 0,
      HIRED: 0,
    };
    candidates.forEach(c => { stats[c.status as keyof typeof stats]++; });
    return HttpResponse.json(stats);
  }),

  http.get('/api/candidates/status/:status', ({ params }) => {
    const filtered = candidates.filter(c => c.status === params.status);
    return HttpResponse.json(filtered);
  }),
];

export const worker = setupWorker(...handlers);

// For Node.js testing (Vitest)
export const server = handlers;