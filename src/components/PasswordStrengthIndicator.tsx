import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

interface StrengthResult {
  level: StrengthLevel;
  score: number;
  label: string;
}

function calculateStrength(password: string): StrengthResult {
  if (!password) {
    return { level: 'weak', score: 0, label: '' };
  }

  let score = 0;

  // Length checks
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (password.length >= 14) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Determine level
  let level: StrengthLevel;
  let label: string;

  if (score <= 2) {
    level = 'weak';
    label = 'Weak';
  } else if (score <= 4) {
    level = 'fair';
    label = 'Fair';
  } else if (score <= 5) {
    level = 'good';
    label = 'Good';
  } else {
    level = 'strong';
    label = 'Strong';
  }

  return { level, score: Math.min(score, 7), label };
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  const barColors = {
    weak: 'bg-destructive',
    fair: 'bg-yellow-500',
    good: 'bg-blue-500',
    strong: 'bg-green-500',
  };

  const textColors = {
    weak: 'text-destructive',
    fair: 'text-yellow-500',
    good: 'text-blue-500',
    strong: 'text-green-500',
  };

  const filledBars = Math.ceil((strength.score / 7) * 4);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              bar <= filledBars ? barColors[strength.level] : 'bg-muted'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs', textColors[strength.level])}>
        {strength.label}
      </p>
    </div>
  );
}
