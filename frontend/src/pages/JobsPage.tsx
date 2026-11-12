import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jobApi, type Job, type JobStatus } from '../lib/api';
import { formatExperience } from '../lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Input';
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit3, Eye, FolderKanban } from 'lucide-react';

const STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};

const STATUS_VARIANTS: Record<JobStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
  DRAFT: 'default',
  ACTIVE: 'success',
  CLOSED: 'warning',
  ARCHIVED: 'danger',
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
};

const WORK_MODE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ON_SITE: 'On-site',
};

export function JobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    title: '',
    status: '' as JobStatus | '',
  });

  const loadJobs = async () => {
    try {
      const response = await jobApi.myJobs();
      setJobs(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchTitle = job.title.toLowerCase().includes(filters.title.toLowerCase());
    const matchStatus = !filters.status || job.status === filters.status;
    return matchTitle && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job role?')) return;
    try {
      await jobApi.delete(id);
      toast.success('Job deleted');
      loadJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete job');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posted Job Roles</h1>
          <p className="text-gray-500 mt-1">Manage your job postings and track applications</p>
        </div>
        <Link to="/jobs/post" className="flex items-center gap-2">
          <Button>
            <Plus className="w-4 h-4" /> Post New Job
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardContent className="p-4 grid gap-4 sm:grid-cols-4 items-end">
          <div className="col-span-full sm:col-span-3 lg:col-span-2">
            <Input
              label="Search by title"
              value={filters.title}
              onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Search job titles..."
            />
          </div>
          <div className="sm:col-span-1 lg:col-span-1">
            <Select
              label="Status"
              options={[
                { value: '', label: 'All statuses' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'CLOSED', label: 'Closed' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]}
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as JobStatus | '' }))}
              placeholder="All"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{jobs.filter((j) => j.status === 'ACTIVE').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">{jobs.filter((j) => j.status === 'DRAFT').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{jobs.filter((j) => j.status === 'CLOSED').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Listings</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No jobs posted yet</h3>
              <p className="text-gray-500 mt-1">Post your first job role to start receiving applications.</p>
              <Link to="/jobs/post" className="mt-4 inline-block">
                <Button variant="primary">Post a New Job</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableHeader>
                  <tr className="border-b border-gray-100">
                    <TableHead width="25%">Title</TableHead>
                    <TableHead width="15%">Employment Type</TableHead>
                    <TableHead width="12%">Work Mode</TableHead>
                    <TableHead width="15%">Education</TableHead>
                    <TableHead width="14%">Experience</TableHead>
                    <TableHead width="10%">Status</TableHead>
                    <TableHead width="12%" className="text-right">Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id} clickable onClick={() => navigate(`/jobs/${job.id}`)}>
                      <TableCell className="font-medium text-gray-900">{job.title}</TableCell>
                      <TableCell>
                        <Badge variant="default" size="sm">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="info" size="sm">{WORK_MODE_LABELS[job.workMode]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="primary" size="sm">{job.educationRequirement || 'Not specified'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{formatExperience(job)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[job.status]} size="sm">{STATUS_LABELS[job.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
                            className="p-2 text-gray-400 hover:text-primary-600"
                            title="View details"
                            aria-label={`View ${job.title}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/jobs/post/${job.id}`); }}
                            className="p-2 text-gray-400 hover:text-primary-600"
                            title="Edit job"
                            aria-label={`Edit ${job.title}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}
                            className="p-2 text-gray-400 hover:text-red-600"
                            title="Delete job"
                            aria-label={`Delete ${job.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {filteredJobs.length} of {jobs.length} job(s)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/jobs/post')}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Post New Job
            </button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
