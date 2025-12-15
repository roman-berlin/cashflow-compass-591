import type { Tables } from "@/integrations/supabase/types";

export type MarketStatus = 'normal' | 'correction' | 'bear' | 'crash';

export interface StrategyResult {
  recommendation_type: string;
  recommendation_text: string;
  transfer_amount: number | null;
  market_status: MarketStatus;
  priority: number;
}

export interface PortfolioState {
  cashValue: number;
  stocksValue: number;
  totalValue: number;
  cashPercent: number;
  stocksPercent: number;
}

export interface MarketState {
  lastPrice: number;
  high52w: number;
  drawdownPercent: number;
}

export interface AmmoState {
  tranche1Used: boolean;
  tranche2Used: boolean;
  tranche3Used: boolean;
}

export function calculateDrawdown(lastPrice: number, high52w: number): number {
  return ((high52w - lastPrice) / high52w) * 100;
}

export function getMarketStatus(drawdownPercent: number, settings: Tables<'settings'>): MarketStatus {
  if (drawdownPercent >= settings.tranche_3_trigger) return 'crash';
  if (drawdownPercent >= settings.tranche_2_trigger) return 'bear';
  if (drawdownPercent >= settings.tranche_1_trigger) return 'correction';
  return 'normal';
}

export function runStrategy(
  portfolio: PortfolioState,
  market: MarketState,
  ammo: AmmoState,
  settings: Tables<'settings'>
): StrategyResult {
  const { cashPercent, stocksPercent, cashValue, totalValue } = portfolio;
  const { drawdownPercent } = market;
  const marketStatus = getMarketStatus(drawdownPercent, settings);

  // Priority 1: Fire Ammo Tranche 3 (30%+ drawdown)
  if (drawdownPercent >= settings.tranche_3_trigger && !ammo.tranche3Used && cashValue > 0) {
    const ammoAmount = cashValue; // Deploy all remaining cash
    return {
      recommendation_type: 'FIRE_AMMO_3',
      recommendation_text: `CRASH ALERT! Market down ${drawdownPercent.toFixed(1)}%. Deploy ALL remaining cash ($${ammoAmount.toLocaleString()}) to stocks immediately.`,
      transfer_amount: ammoAmount,
      market_status: marketStatus,
      priority: 1,
    };
  }

  // Priority 2: Fire Ammo Tranche 2 (20%+ drawdown)
  if (drawdownPercent >= settings.tranche_2_trigger && !ammo.tranche2Used && cashValue > 0) {
    const ammoAmount = Math.min(cashValue * 0.5, cashValue); // Deploy 50% of cash
    return {
      recommendation_type: 'FIRE_AMMO_2',
      recommendation_text: `BEAR MARKET! Market down ${drawdownPercent.toFixed(1)}%. Deploy 50% of cash ($${ammoAmount.toLocaleString()}) to stocks.`,
      transfer_amount: ammoAmount,
      market_status: marketStatus,
      priority: 2,
    };
  }

  // Priority 3: Fire Ammo Tranche 1 (10%+ drawdown)
  if (drawdownPercent >= settings.tranche_1_trigger && !ammo.tranche1Used && cashValue > 0) {
    const ammoAmount = Math.min(cashValue * 0.33, cashValue); // Deploy 33% of cash
    return {
      recommendation_type: 'FIRE_AMMO_1',
      recommendation_text: `CORRECTION! Market down ${drawdownPercent.toFixed(1)}%. Deploy 33% of cash ($${ammoAmount.toLocaleString()}) to stocks.`,
      transfer_amount: ammoAmount,
      market_status: marketStatus,
      priority: 3,
    };
  }

  // Priority 4: Stop contributing to cash if cash > 50%
  if (cashPercent > settings.stop_cash_threshold) {
    return {
      recommendation_type: 'STOP_CASH',
      recommendation_text: `Cash allocation (${cashPercent.toFixed(1)}%) exceeds ${settings.stop_cash_threshold}%. Stop contributing to cash - direct all contributions to stocks.`,
      transfer_amount: null,
      market_status: marketStatus,
      priority: 4,
    };
  }

  // Priority 5: Rebuild Ammo if drawdown < 10% and ammo was used
  const ammoWasUsed = ammo.tranche1Used || ammo.tranche2Used || ammo.tranche3Used;
  if (drawdownPercent < settings.rebuild_threshold && ammoWasUsed && cashPercent < settings.cash_target_percent) {
    const targetCash = (settings.cash_target_percent / 100) * totalValue;
    const rebuildAmount = targetCash - cashValue;
    return {
      recommendation_type: 'REBUILD_AMMO',
      recommendation_text: `Market recovered (drawdown ${drawdownPercent.toFixed(1)}%). Rebuild cash reserves to ${settings.cash_target_percent}%. Transfer $${rebuildAmount.toLocaleString()} from stocks to cash.`,
      transfer_amount: rebuildAmount,
      market_status: marketStatus,
      priority: 5,
    };
  }

  // Priority 6: Normal contribution split
  const cashContribution = (settings.contribution_split_cash_percent / 100) * settings.monthly_contribution_total;
  const stocksContribution = (settings.contribution_split_stocks_percent / 100) * settings.monthly_contribution_total;
  
  return {
    recommendation_type: 'NORMAL',
    recommendation_text: `Market normal (drawdown ${drawdownPercent.toFixed(1)}%). Split contribution: $${cashContribution.toLocaleString()} to cash, $${stocksContribution.toLocaleString()} to stocks.`,
    transfer_amount: null,
    market_status: marketStatus,
    priority: 6,
  };
}
