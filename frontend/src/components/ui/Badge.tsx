import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    primary: 'bg-primary-100 text-primary-800',
  };
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, BadgeProps['variant']> = {
    NEW: 'info',
    SHORTLISTED: 'success',
    REJECTED: 'danger',
    CONTACTED: 'warning',
    INTERVIEWING: 'primary',
    HIRED: 'success',
  };
  const labels: Record<string, string> = {
    NEW: 'New',
    SHORTLISTED: 'Shortlisted',
    REJECTED: 'Rejected',
    CONTACTED: 'Contacted',
    INTERVIEWING: 'Interviewing',
    HIRED: 'Hired',
  };
  return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
}