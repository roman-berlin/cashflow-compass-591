-- Add DELETE policy to ammo_state table so users can reset their strategy
CREATE POLICY "Users can delete own ammo state"
ON public.ammo_state
FOR DELETE
USING (auth.uid() = user_id);