-- Add target percentage columns for the three-asset model
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS snp_target_percent numeric DEFAULT 50,
ADD COLUMN IF NOT EXISTS ta125_target_percent numeric DEFAULT 25;

-- Update cash_target_percent default to 25 to match the new model
-- (existing rows keep their values, only new rows get the default)