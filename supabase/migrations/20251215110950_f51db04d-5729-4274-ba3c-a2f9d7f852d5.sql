-- Add currency column to settings
ALTER TABLE public.settings 
ADD COLUMN currency text NOT NULL DEFAULT 'USD';