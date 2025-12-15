-- Update default currency to NIS
ALTER TABLE public.settings 
ALTER COLUMN currency SET DEFAULT 'NIS';