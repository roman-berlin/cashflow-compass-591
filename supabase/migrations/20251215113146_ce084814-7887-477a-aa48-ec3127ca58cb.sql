-- Update default currency to ILS
ALTER TABLE public.settings 
ALTER COLUMN currency SET DEFAULT 'ILS';