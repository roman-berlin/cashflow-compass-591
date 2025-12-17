-- Fix missing RLS policies

-- recommendations_log: This is an audit log - add restrictive policies to prevent modification
CREATE POLICY "No user updates on recommendations_log"
ON public.recommendations_log
FOR UPDATE
USING (false);

CREATE POLICY "No user deletes on recommendations_log"
ON public.recommendations_log
FOR DELETE
USING (false);

-- portfolio_snapshots: Allow users to delete their own snapshots
CREATE POLICY "Users can delete own snapshots"
ON public.portfolio_snapshots
FOR DELETE
USING (auth.uid() = user_id);

-- market_state: Allow users to delete their own market state
CREATE POLICY "Users can delete own market state"
ON public.market_state
FOR DELETE
USING (auth.uid() = user_id);

-- settings: Allow users to delete their own settings
CREATE POLICY "Users can delete own settings"
ON public.settings
FOR DELETE
USING (auth.uid() = user_id);

-- user_roles: Add restrictive policies (managed by edge functions with service role)
CREATE POLICY "No direct user inserts on user_roles"
ON public.user_roles
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct user updates on user_roles"
ON public.user_roles
FOR UPDATE
USING (false);

CREATE POLICY "No direct user deletes on user_roles"
ON public.user_roles
FOR DELETE
USING (false);