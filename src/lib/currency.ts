export type Currency = 'USD' | 'NIS';

export function getCurrencySymbol(currency: Currency | string): string {
  switch (currency) {
    case 'NIS':
    case 'ILS': // backward compatibility
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

export function getCurrencyLabel(currency: Currency | string): string {
  switch (currency) {
    case 'NIS':
    case 'ILS':
      return 'NIS';
    case 'USD':
    default:
      return 'USD';
  }
}
