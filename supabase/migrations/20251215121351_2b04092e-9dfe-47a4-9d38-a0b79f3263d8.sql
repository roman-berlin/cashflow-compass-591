-- Add UPDATE policy for market_state table
CREATE POLICY "Users can update own market state"
ON public.market_state
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);