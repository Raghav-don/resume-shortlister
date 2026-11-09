import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { candidateApi, type Candidate } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatRelativeTime, formatCurrency, cn } from '../lib/utils';
import { PageLoading } from '../components/ui/LoadingSpinner';

const STATUS_CONFIG = {
  NEW: { label: 'New Applications', icon: FileText, color: 'bg-blue-100 text-blue-600', iconColor: 'text-blue-600' },
  SHORTLISTED: { label: 'Shortlisted', icon: CheckCircle, color: 'bg-green-100 text-green-600', iconColor: 'text-green-600' },
  INTERVIEWING: { label: 'Interviewing', icon: Users, color: 'bg-purple-100 text-purple-600', iconColor: 'text-purple-600' },
  HIRED: { label: 'Hired', icon: TrendingUp, color: 'bg-indigo-100 text-indigo-600', iconColor: 'text-indigo-600' },
  REJECTED: { label: 'Rejected', icon: FileText, color: 'bg-red-100 text-red-600', iconColor: 'text-red-600' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

export function DashboardPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, candidatesRes] = await Promise.all([
          candidateApi.getStats(),
          candidateApi.list({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' }),
        ]);
        setStats(statsRes.data);
        setRecentCandidates(candidatesRes.data.content);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTotalCandidates = () => Object.values(stats).reduce((a, b) => a + b, 0);

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your candidate pipeline</p>
        </div>
        <Link to="/candidates">
          <Button>View All Candidates</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <Link key={key} to={`/candidates?status=${key}`} className="card hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{config.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats[key as StatusKey] || 0}</p>
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', config.color)}>
                  <config.icon className={cn('w-6 h-6', config.iconColor)} aria-hidden="true" />
                </div>
              </div>
            </div>
          </Link>
        ))}
        <Link to="/candidates" className="card hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Candidates</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{getTotalCandidates()}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-600" aria-hidden="true" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Candidates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Applications</CardTitle>
              <p className="text-sm text-gray-500">Latest candidates added to the pipeline</p>
            </div>
            <Link to="/candidates"><Button variant="ghost" size="sm">View All</Button></Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentCandidates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No candidates yet</h3>
              <p className="text-gray-500 mt-1">Candidates will appear here once they apply</p>
              <Link to="/apply" className="mt-4 inline-block">
                <Button variant="primary">Share Application Link</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link to={`/candidates/${candidate.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                          {candidate.fullName}
                        </Link>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{candidate.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{candidate.yearsOfExperience} yrs</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {candidate.technicalSkills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="primary" size="sm">{skill}</Badge>
                          ))}
                          {candidate.technicalSkills.length > 3 && (
                            <Badge variant="default" size="sm">+{candidate.technicalSkills.length - 3}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{candidate.location}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(candidate.salaryExpectation, candidate.currency)}</td>
                      <td className="px-4 py-3"><StatusBadge status={candidate.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatRelativeTime(candidate.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/candidates/${candidate.id}`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Link to="/apply" className="h-24 flex flex-col items-center justify-center gap-2 p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <FileText className="w-8 h-8 text-primary-600" />
              <span className="font-medium text-gray-900">Share Apply Link</span>
              <p className="text-xs text-gray-500">Get public application URL</p>
            </Link>
            <Link to="/candidates?status=NEW" className="h-24 flex flex-col items-center justify-center gap-2 p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <Clock className="w-8 h-8 text-gray-600" />
              <span className="font-medium text-gray-900">Review New ({stats.NEW || 0})</span>
              <p className="text-xs text-gray-500">Pending applications</p>
            </Link>
            <Link to="/candidates?status=SHORTLISTED" className="h-24 flex flex-col items-center justify-center gap-2 p-6 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-colors">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="font-medium text-gray-900">Shortlisted ({stats.SHORTLISTED || 0})</span>
              <p className="text-xs text-gray-500">Ready for interview</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}