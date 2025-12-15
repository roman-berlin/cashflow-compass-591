-- Add unique constraint on user_id for settings table
ALTER TABLE public.settings 
ADD CONSTRAINT settings_user_id_unique UNIQUE (user_id);