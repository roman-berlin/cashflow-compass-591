export type Currency = 'USD' | 'ILS';

export function getCurrencySymbol(currency: Currency | string): string {
  switch (currency) {
    case 'ILS':
      return '₪';
    case 'USD':
    default:
      return '$';
  }
}

export function formatCurrency(amount: number, currency: Currency | string): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString()}`;
}
