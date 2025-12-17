-- Add RLS policies to auth_tokens table
-- This table should only be accessed by edge functions using service_role key
-- Regular users should have no direct access to prevent token theft

-- Policy: No user can SELECT auth_tokens (service role bypasses RLS for edge functions)
CREATE POLICY "No direct user access to auth_tokens"
ON public.auth_tokens
FOR SELECT
TO authenticated
USING (false);

-- Policy: No user can INSERT auth_tokens directly
CREATE POLICY "No direct user insert to auth_tokens"
ON public.auth_tokens
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Policy: No user can UPDATE auth_tokens directly
CREATE POLICY "No direct user update to auth_tokens"
ON public.auth_tokens
FOR UPDATE
TO authenticated
USING (false);

-- Policy: No user can DELETE auth_tokens directly
CREATE POLICY "No direct user delete to auth_tokens"
ON public.auth_tokens
FOR DELETE
TO authenticated
USING (false);