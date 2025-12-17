import { z } from 'zod';

// Auth validation schemas
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(72, 'Password must be less than 72 characters');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Full name is required')
  .max(100, 'Name must be less than 100 characters');

export const setPasswordSchema = z.object({
  name: nameSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Admin validation schemas
export const inviteUserSchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(100, 'Name must be less than 100 characters').optional(),
  role: z.enum(['user', 'admin']).default('user'),
});

// Settings validation schemas
export const percentageSchema = z
  .number()
  .min(0, 'Cannot be negative')
  .max(100, 'Cannot exceed 100%');

export const settingsSchema = z.object({
  stocks_target_percent: percentageSchema,
  cash_target_percent: percentageSchema,
  tranche_1_trigger: percentageSchema,
  tranche_2_trigger: percentageSchema,
  tranche_3_trigger: percentageSchema,
  rebuild_threshold: percentageSchema,
  cash_min_pct: percentageSchema,
  cash_max_pct: percentageSchema,
}).refine((data) => data.stocks_target_percent + data.cash_target_percent === 100, {
  message: 'Stocks and cash target must equal 100%',
  path: ['cash_target_percent'],
}).refine((data) => data.cash_min_pct <= data.cash_target_percent, {
  message: 'Min cannot exceed target',
  path: ['cash_min_pct'],
}).refine((data) => data.cash_max_pct >= data.cash_target_percent, {
  message: 'Max cannot be less than target',
  path: ['cash_max_pct'],
}).refine((data) => data.tranche_1_trigger <= data.tranche_2_trigger, {
  message: 'Tranche 1 must be ≤ Tranche 2',
  path: ['tranche_1_trigger'],
}).refine((data) => data.tranche_2_trigger <= data.tranche_3_trigger, {
  message: 'Tranche 2 must be ≤ Tranche 3',
  path: ['tranche_2_trigger'],
});

// Portfolio update validation schemas
export const contributionSchema = z
  .number()
  .min(0, 'Cannot be negative');

export const portfolioUpdateSchema = z.object({
  valueSp: contributionSchema,
  valueTa: contributionSchema,
  valueCash: contributionSchema,
  contributionSpy: contributionSchema,
  contributionTa: contributionSchema,
  contributionCash: contributionSchema,
});

// Helper to get first error message from zod error
export function getFirstError(error: z.ZodError): string {
  return error.errors[0]?.message || 'Validation error';
}

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type PortfolioUpdateInput = z.infer<typeof portfolioUpdateSchema>;
