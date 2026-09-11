export interface Stock {
  id: number;
  name: string;
  sector: string;

  purchasePrice: number;
  quantity: number;
  investment: number;
  portfolioPercentage: number;
  exchangeCode: string;

  yahooSymbol: string | null;
  googleSymbol: string | null;

  cmp: number | null;
  presentValue: number | null;
  gainLoss: number | null;

  peRatio: number | null;
  latestEarnings: number | null;
}