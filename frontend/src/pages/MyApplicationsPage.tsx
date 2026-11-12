import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jobApplicationApi, type JobApplicationResponse, type ApplicationStatus } from '../lib/api';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { FileText, ArrowRight, RefreshCw } from 'lucide-react';
import { PageLoading } from '../components/ui/LoadingSpinner';
import { formatRelativeTime } from '../lib/utils';
import toast from 'react-hot-toast';

const STATUS_VARIANTS: Record<ApplicationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
  PENDING: 'warning',
  REVIEWED: 'info',
  SHORTLISTED: 'success',
  REJECTED: 'danger',
  HIRED: 'primary',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  REVIEWED: 'Reviewed',
  SHORTLISTED: 'Shortlisted',
  REJECTED: 'Rejected',
  HIRED: 'Hired',
};

export function MyApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplicationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadApplications = async () => {
    try {
      const response = await jobApplicationApi.my(0, 50, 'appliedAt', 'desc');
      setApplications(response.data.content);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleWithdraw = async (id: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await jobApplicationApi.withdraw(id);
      toast.success('Application withdrawn');
      loadApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to withdraw application');
    }
  };

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-500 mt-1">Track your job applications and their status</p>
        </div>
        <Button onClick={() => loadApplications()}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
          <p className="text-gray-500 mt-1">You haven't applied to any jobs yet.</p>
          <Link to="/jobs" className="mt-4 inline-block">
            <Button variant="primary">
              <ArrowRight className="w-4 h-4" /> Browse Jobs
            </Button>
          </Link>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableHeader>
                  <tr className="border-b border-gray-100">
                    <TableHead width="25%">Job Title</TableHead>
                    <TableHead width="20%">Status</TableHead>
                    <TableHead width="20%">Applied</TableHead>
                    <TableHead width="15%">Experience</TableHead>
                    <TableHead width="20%" className="text-right">Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id} clickable onClick={() => navigate(`/my-applications/${app.id}`)}>
                      <TableCell className="font-medium text-gray-900">{app.jobTitle || 'Unknown Position'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[app.status]} size="sm">
                          {STATUS_LABELS[app.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{formatRelativeTime(app.appliedAt)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{app.yearsOfExperience} yrs</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleWithdraw(app.id); }}>
                          Withdraw
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
