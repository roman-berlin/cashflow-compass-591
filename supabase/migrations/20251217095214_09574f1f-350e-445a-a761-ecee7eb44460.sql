-- Add cost basis tracking columns to portfolio_snapshots
ALTER TABLE public.portfolio_snapshots 
ADD COLUMN cost_basis_sp numeric NOT NULL DEFAULT 0,
ADD COLUMN cost_basis_ta numeric NOT NULL DEFAULT 0,
ADD COLUMN cost_basis_cash numeric NOT NULL DEFAULT 0;