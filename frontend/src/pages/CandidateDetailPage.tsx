import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Download, Share2, Mail, Briefcase, Link as LinkIcon, Github, CheckCircle, TrendingUp, Users, X, Upload, Globe, FileText } from 'lucide-react';
import { candidateApi, type Candidate } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/Modal';
import { PageLoading } from '../components/ui/LoadingSpinner';
import { formatCurrency, formatRelativeTime } from '../lib/utils';
import toast from 'react-hot-toast';

const STATUS_OPTIONS: Candidate['status'][] = ['NEW', 'SHORTLISTED', 'CONTACTED', 'INTERVIEWING', 'HIRED', 'REJECTED'];

export function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdate, setStatusUpdate] = useState<Candidate['status'] | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchCandidate = async () => {
      try {
        const response = await candidateApi.get(id);
        setCandidate(response.data);
        setNotes(response.data.recruiterNotes || '');
      } catch (error) {
        toast.error('Failed to load candidate');
        navigate('/candidates');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidate();
  }, [id, navigate]);

  const handleStatusChange = async (newStatus: Candidate['status']) => {
    if (!candidate) return;
    try {
      await candidateApi.updateStatus(candidate.id, newStatus, notes || undefined);
      toast.success(`Status updated to ${newStatus}`);
      setCandidate(prev => prev ? { ...prev, status: newStatus, recruiterNotes: notes } : null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleNotesSave = async () => {
    if (!candidate) return;
    try {
      await candidateApi.updateStatus(candidate.id, candidate.status, notes);
      toast.success('Notes saved');
    } catch (error) {
      toast.error('Failed to save notes');
    }
  };

  if (isLoading) return <PageLoading />;
  if (!candidate) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{candidate.fullName}</h1>
          <p className="text-gray-500">{candidate.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={candidate.status} />
          <Button variant="secondary" size="sm" onClick={() => { /* share logic */ }}>
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => { /* download logic */ }}>
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" /> Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div><dt className="text-sm text-gray-500">Email</dt><dd className="font-medium mt-1">{candidate.email}</dd></div>
                <div><dt className="text-sm text-gray-500">Phone</dt><dd className="font-medium mt-1">{candidate.phone || 'Not provided'}</dd></div>
                <div><dt className="text-sm text-gray-500">Location</dt><dd className="font-medium mt-1">{candidate.location}</dd></div>
                <div><dt className="text-sm text-gray-500">Work Preference</dt><dd className="font-medium mt-1"><Badge variant={candidate.remotePreference === 'REMOTE' ? 'success' : candidate.remotePreference === 'HYBRID' ? 'warning' : 'default'}>{candidate.remotePreference.replace('_', ' ')}</Badge></dd></div>
                <div><dt className="text-sm text-gray-500">Notice Period</dt><dd className="font-medium mt-1">{candidate.noticePeriod}</dd></div>
                <div><dt className="text-sm text-gray-500">Expected Salary</dt><dd className="font-medium mt-1">{formatCurrency(candidate.salaryExpectation, candidate.currency)}</dd></div>
              </dl>
            </CardContent>
          </Card>

          {/* Experience & Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5" /> Experience & Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div><dt className="text-sm text-gray-500">Years of Experience</dt><dd className="font-medium mt-1">{candidate.yearsOfExperience} years</dd></div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-gray-500">Technical Skills</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {candidate.technicalSkills.map((skill) => (
                      <Badge key={skill} variant="primary">{skill}</Badge>
                    ))}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Links */}
          {(candidate.resumeUrl || candidate.portfolioUrl || candidate.linkedinUrl || candidate.githubUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LinkIcon className="w-5 h-5" /> Profile Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {candidate.resumeUrl && <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary"><Upload className="w-4 h-4" /> Resume</a>}
                  {candidate.portfolioUrl && <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary"><Globe className="w-4 h-4" /> Portfolio</a>}
                  {candidate.linkedinUrl && <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> LinkedIn</a>}
                  {candidate.githubUrl && <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary"><Github className="w-4 h-4" /> GitHub</a>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recruiter Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Edit className="w-5 h-5" /> Recruiter Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input min-h-[120px] resize-y"
                placeholder="Add internal notes about this candidate..."
              />
              <div className="mt-3 flex justify-end">
                <Button onClick={handleNotesSave} size="sm">Save Notes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimelineItem time={formatRelativeTime(candidate.createdAt)} title="Application Received" description="Candidate submitted their profile" icon={<FileText className="w-4 h-4 text-blue-600" />} />
                {candidate.status !== 'NEW' && (
                  <TimelineItem time={formatRelativeTime(candidate.updatedAt)} title={`Status: ${candidate.status}`} description={candidate.recruiterNotes || 'Status updated by recruiter'} icon={<CheckCircle className="w-4 h-4 text-green-600" />} />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <Button
                    key={status}
                    variant={status === 'REJECTED' ? 'danger' : status === 'HIRED' ? 'primary' : 'secondary'}
                    className="h-12"
                    disabled={candidate.status === status}
                    onClick={() => setStatusUpdate(status)}
                  >
                    {status === 'SHORTLISTED' && <CheckCircle className="w-4 h-4" />}
                    {status === 'CONTACTED' && <Mail className="w-4 h-4" />}
                    {status === 'INTERVIEWING' && <Users className="w-4 h-4" />}
                    {status === 'HIRED' && <TrendingUp className="w-4 h-4" />}
                    {status === 'REJECTED' && <X className="w-4 h-4" />}
                    <span className="hidden sm:inline">{status}</span>
                    <span className="hidden sm:hidden">{status[0]}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardContent className="pt-0">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-gray-500">Applied</dt><dd className="font-medium">{formatRelativeTime(candidate.createdAt)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">Last Updated</dt><dd className="font-medium">{formatRelativeTime(candidate.updatedAt)}</dd></div>
                <div className="flex justify-between"><dt className="text-gray-500">ID</dt><dd className="font-mono text-xs text-gray-500">{candidate.id.slice(0, 8)}...</dd></div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {statusUpdate && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setStatusUpdate(null)}
          onConfirm={() => handleStatusChange(statusUpdate)}
          title={`Mark as ${statusUpdate}`}
          message={`Are you sure you want to mark ${candidate.fullName} as ${statusUpdate}?`}
          confirmText="Yes, update"
          variant={statusUpdate === 'REJECTED' ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
}

function TimelineItem({ time, title, description, icon }: { time: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">{icon}</div>
      <div className="flex-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{title}</span>
          <span className="text-xs text-gray-500">{time}</span>
        </div>
        <p className="text-sm text-gray-600 ml-10">{description}</p>
      </div>
    </div>
  );
}