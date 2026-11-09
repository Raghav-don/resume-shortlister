import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, Phone, Briefcase, MapPin, Globe, DollarSign, Link as LinkIcon, Github, Upload, CheckCircle, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { candidateApi } from '../lib/api';
import { CandidateLayout } from '../layouts/CandidateLayout';

const REMOTE_OPTIONS = [
  { value: 'ON_SITE', label: 'On-site' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
];

const NOTICE_OPTIONS = [
  { value: 'Immediate', label: 'Immediate' },
  { value: '15 days', label: '15 days' },
  { value: '30 days', label: '30 days' },
  { value: '45 days', label: '45 days' },
  { value: '60 days', label: '60 days' },
  { value: '90 days', label: '90 days' },
  { value: 'Other', label: 'Other' },
];

const SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'Go', 'Rust',
  'Spring Boot', 'Django', 'FastAPI', 'Express', 'Next.js', 'Remix', 'PostgreSQL', 'MySQL', 'MongoDB',
  'Redis', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'GraphQL', 'REST', 'gRPC', 'CI/CD',
  'Git', 'Testing', 'Jest', 'Cypress', 'Playwright', 'Tailwind', 'CSS', 'HTML', 'Webpack', 'Vite'
];

const candidateSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional().or(z.literal('')),
  yearsOfExperience: z.number().min(0, 'Experience cannot be negative').max(50, 'Experience seems too high'),
  technicalSkills: z.array(z.string().min(1)).min(1, 'At least one skill is required').max(30),
  location: z.string().min(2, 'Location is required').max(100),
  remotePreference: z.enum(['ON_SITE', 'HYBRID', 'REMOTE']),
  noticePeriod: z.string().min(1, 'Notice period is required').max(50),
  salaryExpectation: z.number().min(0, 'Salary cannot be negative'),
  currency: z.string().length(3).default('USD'),
  resumeUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  githubUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type CandidateForm = z.infer<typeof candidateSchema>;

export function CandidateFormPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      yearsOfExperience: 0,
      salaryExpectation: 0,
      currency: 'USD',
      technicalSkills: [],
    },
  });

  const skills = watch('technicalSkills');

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 30) {
      setValue('technicalSkills', [...skills, trimmed]);
      setSkillInput('');
      setShowSuggestions(false);
    }
  };

  const removeSkill = (skill: string) => {
    setValue('technicalSkills', skills.filter(s => s !== skill));
  };

  const filteredSuggestions = SKILL_SUGGESTIONS.filter(s =>
    s.toLowerCase().includes(skillInput.toLowerCase()) && !skills.includes(s)
  ).slice(0, 8);

  const onSubmit = async (data: CandidateForm) => {
    setIsLoading(true);
    try {
      await candidateApi.create(data);
      toast.success('Application submitted successfully!');
      navigate('/apply/success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Submission failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CandidateLayout>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Submit Your Profile</h1>
          <p className="text-lg text-gray-600">Apply to join our talent pool. We'll match you with relevant opportunities.</p>
        </div>

        <Card variant="elevated" padding="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Info */}
            <fieldset>
              <legend className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Personal Information
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full Name" placeholder="John Doe" {...register('fullName')} error={errors.fullName?.message}>
                  <User className="w-5 h-5 text-gray-400" />
                </Input>
                <Input label="Email" type="email" placeholder="john@example.com" {...register('email')} error={errors.email?.message}>
                  <Mail className="w-5 h-5 text-gray-400" />
                </Input>
                <Input label="Phone (optional)" type="tel" placeholder="+1 (555) 123-4567" {...register('phone')} error={errors.phone?.message}>
                  <Phone className="w-5 h-5 text-gray-400" />
                </Input>
              </div>
            </fieldset>

            {/* Experience & Skills */}
            <fieldset>
              <legend className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary-600" />
                Experience & Skills
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Years of Experience" type="number" min="0" max="50" {...register('yearsOfExperience', { valueAsNumber: true })} error={errors.yearsOfExperience?.message}>
                  <Briefcase className="w-5 h-5 text-gray-400" />
                </Input>
              </div>

              <div>
                <label className="label">Technical Skills <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[44px]">
                    {skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="hover:bg-primary-100 rounded-full p-0.5" aria-label={`Remove ${skill}`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => { setSkillInput(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                      placeholder="Add a skill (press Enter)"
                      className="flex-1 min-w-[150px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      aria-label="Add skill"
                    />
                  </div>
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                      {filteredSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => { setValue('technicalSkills', [...skills, suggestion]); setSkillInput(''); setShowSuggestions(false); }}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.technicalSkills && <p className="mt-1.5 text-sm text-red-600">{errors.technicalSkills.message}</p>}
                </div>
                <p className="mt-1 text-sm text-gray-500">Press Enter to add skills. Maximum 30 skills.</p>
              </div>
            </fieldset>

            {/* Location & Preferences */}
            <fieldset>
              <legend className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                Location & Work Preferences
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Current Location" placeholder="San Francisco, CA" {...register('location')} error={errors.location?.message}>
                  <MapPin className="w-5 h-5 text-gray-400" />
                </Input>
                <Select label="Work Preference" options={REMOTE_OPTIONS} placeholder="Select preference" {...register('remotePreference')} error={errors.remotePreference?.message} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Notice Period" options={NOTICE_OPTIONS} placeholder="Select notice period" {...register('noticePeriod')} error={errors.noticePeriod?.message} />
                <Input label="Expected Salary (annual)" type="number" min="0" step="1000" placeholder="120000" {...register('salaryExpectation', { valueAsNumber: true })} error={errors.salaryExpectation?.message}>
                  <DollarSign className="w-5 h-5 text-gray-400" />
                </Input>
              </div>
            </fieldset>

            {/* Links */}
            <fieldset>
              <legend className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary-600" />
                Profile Links (Optional)
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Resume URL" type="url" placeholder="https://drive.google.com/..." {...register('resumeUrl')} error={errors.resumeUrl?.message}>
                  <Upload className="w-5 h-5 text-gray-400" />
                </Input>
                <Input label="Portfolio URL" type="url" placeholder="https://johndoe.dev" {...register('portfolioUrl')} error={errors.portfolioUrl?.message}>
                  <Globe className="w-5 h-5 text-gray-400" />
                </Input>
                <Input label="LinkedIn URL" type="url" placeholder="https://linkedin.com/in/johndoe" {...register('linkedinUrl')} error={errors.linkedinUrl?.message}>
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </Input>
                <Input label="GitHub URL" type="url" placeholder="https://github.com/johndoe" {...register('githubUrl')} error={errors.githubUrl?.message}>
                  <Github className="w-5 h-5 text-gray-400" />
                </Input>
              </div>
            </fieldset>

            <div className="pt-4 border-t border-gray-200">
              <Button type="submit" className="w-full sm:w-auto" size="lg" isLoading={isLoading}>
                <CheckCircle className="w-5 h-5" /> Submit Application
              </Button>
              <p className="mt-3 text-center text-sm text-gray-500">By submitting, you agree to our <a href="/privacy" className="text-primary-600 hover:underline">Privacy Policy</a></p>
            </div>
          </form>
        </Card>
      </div>
    </CandidateLayout>
  );
}