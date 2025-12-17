-- Add restrictive RLS policies to rate_limits table
-- This table is only accessed by edge functions using service role key (which bypasses RLS)
-- These policies ensure no direct user access is possible

CREATE POLICY "No direct user select on rate_limits"
ON public.rate_limits
FOR SELECT
USING (false);

CREATE POLICY "No direct user insert on rate_limits"
ON public.rate_limits
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct user update on rate_limits"
ON public.rate_limits
FOR UPDATE
USING (false);

CREATE POLICY "No direct user delete on rate_limits"
ON public.rate_limits
FOR DELETE
USING (false);