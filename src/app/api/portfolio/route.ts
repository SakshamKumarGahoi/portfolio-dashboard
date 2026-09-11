import { NextResponse } from "next/server";

import portfolioData from "@/data/portfolio.json";

import {
  fetchYahooCMP,
  fetchGoogleFinanceData,
} from "@/lib/marketData";

import {
  getCache,
  setCache,
} from "@/lib/cache";

import type { Stock } from "@/types/portfolio";

const CACHE_KEY = "portfolio-live";

const CACHE_TTL = 15_000;

export async function GET() {
  const cachedPortfolio =
    getCache<Stock[]>(CACHE_KEY);

  if (cachedPortfolio) {
    console.log(
      "Returning portfolio from cache"
    );

    return NextResponse.json({
      success: true,
      data: cachedPortfolio,
    });
  }

  console.log(
    "Cache miss - fetching live market data"
  );

  const portfolio =
    portfolioData as Stock[];

  
  const updatedPortfolio =
    await Promise.all(
      portfolio.map(async (stock) => {
        const [
          cmp,
          googleData,
        ] = await Promise.all([
          stock.yahooSymbol
            ? fetchYahooCMP(
                stock.yahooSymbol
              )
            : Promise.resolve(null),

          stock.googleSymbol
            ? fetchGoogleFinanceData(
                stock.googleSymbol
              )
            : Promise.resolve({
                peRatio: null,
                latestEarnings: null,
              }),
        ]);

        
        const finalCmp =
          cmp ?? stock.cmp;

        
        const presentValue =
          finalCmp !== null
            ? finalCmp * stock.quantity
            : stock.presentValue;

        
        const gainLoss =
          presentValue !== null
            ? presentValue - stock.investment
            : stock.gainLoss;

        
        const peRatio =
          googleData.peRatio ??
          stock.peRatio;

        const latestEarnings =
          googleData.latestEarnings ??
          stock.latestEarnings;

        return {
          ...stock,

          cmp: finalCmp,

          presentValue,

          gainLoss,

          peRatio,

          latestEarnings,
        };
      })
    );

  
  setCache(
    CACHE_KEY,
    updatedPortfolio,
    CACHE_TTL
  );

  return NextResponse.json({
    success: true,
    data: updatedPortfolio,
  });
}