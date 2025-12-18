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
  valueCash: number;
  valueSp: number;
  valueTa: number;
  totalValue: number;
  percentCash: number;
  percentSp: number;
  percentTa: number;
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

// Translation function type
type TranslateFunction = (key: string, params?: Record<string, string | number>) => string;

// Helper to format recommendation text with translations
export function getTranslatedRecommendation(
  result: StrategyResult,
  t: TranslateFunction
): string {
  const { recommendation_type, transfer_amount, market_status } = result;
  
  // Extract drawdown from recommendation_text (it's embedded in the English text)
  const drawdownMatch = result.recommendation_text.match(/(\d+\.?\d*)%/);
  const drawdown = drawdownMatch ? drawdownMatch[1] : '0';
  const amount = transfer_amount?.toLocaleString() || '0';
  
  switch (recommendation_type) {
    case 'STOP_CASH_OVER_MAX':
      const cashMatch = result.recommendation_text.match(/Cash allocation \((\d+\.?\d*)%\)/);
      const maxMatch = result.recommendation_text.match(/maximum \((\d+)%\)/);
      const currentCash = cashMatch ? cashMatch[1] : '0';
      const maxCash = maxMatch ? maxMatch[1] : '0';
      return t('strategy.stopCashOverMax', { currentCash, maxCash });
      
    case 'FIRE_AMMO_3':
      return t('strategy.fireAmmo3', { drawdown, amount });
      
    case 'FIRE_AMMO_2':
      return t('strategy.fireAmmo2', { drawdown, amount });
      
    case 'FIRE_AMMO_1':
      return t('strategy.fireAmmo1', { drawdown, amount });
      
    case 'REBUILD_AMMO':
      const targetMatch = result.recommendation_text.match(/to (\d+)%/);
      const target = targetMatch ? targetMatch[1] : '30';
      return t('strategy.rebuildAmmo', { drawdown, target, amount });
      
    case 'NORMAL':
      const cashContribMatch = result.recommendation_text.match(/Split contribution: ([\d,]+) to cash/);
      const stocksContribMatch = result.recommendation_text.match(/([\d,]+) to equities/);
      const cashContrib = cashContribMatch ? cashContribMatch[1] : '0';
      const stocksContrib = stocksContribMatch ? stocksContribMatch[1] : '0';
      return t('strategy.normal', { drawdown, cashContrib, stocksContrib });
      
    default:
      return result.recommendation_text;
  }
}

export function runStrategy(
  portfolio: PortfolioState,
  market: MarketState,
  ammo: AmmoState,
  settings: Tables<'settings'>
): StrategyResult {
  const { percentCash, valueCash, totalValue } = portfolio;
  const { drawdownPercent } = market;
  const marketStatus = getMarketStatus(drawdownPercent, settings);

  // Priority 1: STOP_CASH_OVER_MAX - highest priority, even during drawdown
  if (percentCash > settings.cash_max_pct) {
    return {
      recommendation_type: 'STOP_CASH_OVER_MAX',
      recommendation_text: `Cash allocation (${percentCash.toFixed(1)}%) exceeds maximum (${settings.cash_max_pct}%). Stop contributing to cash - direct all contributions to equities.`,
      transfer_amount: null,
      market_status: marketStatus,
      priority: 1,
    };
  }

  // Priority 2: Deploy Tranche 3 (30%+ drawdown)
  // Each tranche = exactly 1/3 of current cash
  const trancheAmount = valueCash / 3;

  if (drawdownPercent >= settings.tranche_3_trigger && !ammo.tranche3Used && valueCash > 0) {
    return {
      recommendation_type: 'FIRE_AMMO_3',
      recommendation_text: `Significant downturn detected (${drawdownPercent.toFixed(1)}% drawdown). Deploy Tranche 3: 1/3 of current cash (${trancheAmount.toLocaleString()}) to equities.`,
      transfer_amount: trancheAmount,
      market_status: marketStatus,
      priority: 2,
    };
  }

  // Priority 3: Deploy Tranche 2 (20%+ drawdown)
  if (drawdownPercent >= settings.tranche_2_trigger && !ammo.tranche2Used && valueCash > 0) {
    return {
      recommendation_type: 'FIRE_AMMO_2',
      recommendation_text: `Bear market conditions (${drawdownPercent.toFixed(1)}% drawdown). Deploy Tranche 2: 1/3 of current cash (${trancheAmount.toLocaleString()}) to equities.`,
      transfer_amount: trancheAmount,
      market_status: marketStatus,
      priority: 3,
    };
  }

  // Priority 4: Deploy Tranche 1 (10%+ drawdown)
  if (drawdownPercent >= settings.tranche_1_trigger && !ammo.tranche1Used && valueCash > 0) {
    return {
      recommendation_type: 'FIRE_AMMO_1',
      recommendation_text: `Market correction detected (${drawdownPercent.toFixed(1)}% drawdown). Deploy Tranche 1: 1/3 of current cash (${trancheAmount.toLocaleString()}) to equities.`,
      transfer_amount: trancheAmount,
      market_status: marketStatus,
      priority: 4,
    };
  }

  // Priority 5: Rebuild Ammo if drawdown < threshold and ammo was used
  const ammoWasUsed = ammo.tranche1Used || ammo.tranche2Used || ammo.tranche3Used;
  if (drawdownPercent < settings.rebuild_threshold && ammoWasUsed && percentCash < settings.cash_target_percent) {
    const targetCash = (settings.cash_target_percent / 100) * totalValue;
    const rebuildAmount = targetCash - valueCash;
    return {
      recommendation_type: 'REBUILD_AMMO',
      recommendation_text: `Market recovered (${drawdownPercent.toFixed(1)}% drawdown). Rebuild cash reserves to ${settings.cash_target_percent}%. Transfer ${rebuildAmount.toLocaleString()} from equities to cash.`,
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
    recommendation_text: `Market normal (${drawdownPercent.toFixed(1)}% drawdown). Split contribution: ${cashContribution.toLocaleString()} to cash, ${stocksContribution.toLocaleString()} to equities.`,
    transfer_amount: null,
    market_status: marketStatus,
    priority: 6,
  };
}
