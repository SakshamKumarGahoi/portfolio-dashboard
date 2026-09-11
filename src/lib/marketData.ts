function parseNumber(value: string): number | null {
  const cleaned = value
    .replace(/,/g, "")
    .replace(/₹/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

export async function fetchYahooCMP(
  symbol: string
): Promise<number | null> {
  try {
    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/` +
      `${encodeURIComponent(symbol)}?range=1d&interval=1m`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Yahoo request failed: ${response.status}`
      );
    }

    const data = await response.json();

    const price =
      data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    return typeof price === "number"
      ? price
      : null;
  } catch (error) {
    console.error(
      `Yahoo fetch failed for ${symbol}:`,
      error
    );

    return null;
  }
}

export async function fetchGoogleFinanceData(
  symbol: string
): Promise<{
  peRatio: number | null;
  latestEarnings: number | null;
}> {
  try {
    const url =
      `https://www.google.com/finance/quote/` +
      `${encodeURIComponent(symbol)}?hl=en&gl=IN`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 Chrome/140 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Google Finance request failed: ${response.status}`
      );
    }

    const html = await response.text();

    const text = html
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        " "
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        " "
      )
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();

    const peMatch = text.match(
      /P\/E ratio\s+([0-9]+(?:\.[0-9]+)?)/i
    );

    const epsMatch = text.match(
      /EPS\s+₹?\s*(-?[0-9]+(?:\.[0-9]+)?)/i
    );

    const peRatio = peMatch
      ? parseNumber(peMatch[1])
      : null;

    const latestEarnings = epsMatch
      ? parseNumber(epsMatch[1])
      : null;

    console.log(
      `Google Finance ${symbol}:`,
      {
        peRatio,
        latestEarnings,
      }
    );

    return {
      peRatio,
      latestEarnings,
    };
  } catch (error) {
    console.error(
      `Google Finance fetch failed for ${symbol}:`,
      error
    );

    return {
      peRatio: null,
      latestEarnings: null,
    };
  }
}