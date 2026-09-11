"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Stock } from "@/types/portfolio";
import SummaryCard from "@/components/summary-card";
import AllocationChart from "@/components/allocation-chart";

type SortKey =
  | "name"
  | "investment"
  | "portfolioPercentage"
  | "cmp"
  | "presentValue"
  | "gainLoss"
  | "peRatio";

type SortDirection = "asc" | "desc";

const REFRESH_INTERVAL = 15;

function formatMoney(value: number | null) {
  if (value === null) return "N/A";

  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatCompactMoney(value: number) {
  const absolute = Math.abs(value);

  if (absolute >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(2)}Cr`;
  }

  if (absolute >= 100_000) {
    return `₹${(value / 100_000).toFixed(2)}L`;
  }

  if (absolute >= 1_000) {
    return `₹${(value / 1_000).toFixed(1)}K`;
  }

  return formatMoney(value);
}

function formatNumber(value: number | null) {
  if (value === null) return "N/A";

  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function formatPercentage(value: number | null) {
  if (value === null) return "N/A";

  return `${(value * 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}%`;
}

function getReturnPercentage(stock: Stock) {
  if (!stock.investment || stock.gainLoss === null) {
    return null;
  }

  return (stock.gainLoss / stock.investment) * 100;
}

function getGainColor(value: number | null) {
  if (value === null) return "text-[#8da4aa]";
  return value >= 0 ? "text-[#63d471]" : "text-[#f07878]";
}

function getGainBackground(value: number | null) {
  if (value === null) return "bg-[#17343a]";

  return value >= 0
    ? "bg-[#163b2a]"
    : "bg-[#3a2024]";
}

function GainLossValue({
  value,
  percentage,
}: {
  value: number | null;
  percentage?: number | null;
}) {
  if (value === null) {
    return <span className="text-[#8da4aa]">N/A</span>;
  }

  const positive = value >= 0;

  return (
    <div className={`inline-flex items-center gap-1.5 font-semibold ${getGainColor(value)}`}>
      <span
        aria-hidden="true"
        className="text-base"
      >
        {positive ? "↑" : "↓"}
      </span>

      <span>
        {formatMoney(Math.abs(value))}
      </span>

      {percentage !== undefined && percentage !== null && (
        <span className="text-xs opacity-70">
          ({Math.abs(percentage).toFixed(1)}%)
        </span>
      )}
    </div>
  );
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) {
    return (
      <span className="ml-1 text-[#526b71]">
        ↕
      </span>
    );
  }

  return (
    <span className="ml-1 text-[#8de4f2]">
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-(--background) px-4 py-8 md:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-8 space-y-3">
          <div className="h-4 w-40 animate-pulse rounded bg-[#cbdde2]" />
          <div className="h-12 w-80 animate-pulse rounded bg-[#cbdde2]" />
          <div className="h-4 w-64 animate-pulse rounded bg-[#cbdde2]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-44 animate-pulse rounded-[28px] bg-[#d5e5e9]"
            />
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <div className="h-107.5 animate-pulse rounded-[28px] bg-[#d5e5e9] lg:col-span-5" />
          <div className="h-107.5 animate-pulse rounded-[28px] bg-[#d5e5e9] lg:col-span-7" />
        </div>

        <div className="mt-4 h-96 animate-pulse rounded-[28px] bg-[#d5e5e9]" />
      </div>
    </main>
  );
}

function MobileStockCard({ stock }: { stock: Stock }) {
  const returnPercentage = getReturnPercentage(stock);

  return (
    <div className="rounded-2xl bg-[#112a2f] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-white">
            {stock.name}
          </p>

          <p className="mt-1 text-xs text-[#7f999f]">
            {stock.exchangeCode}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${getGainBackground(
            stock.gainLoss
          )} ${getGainColor(stock.gainLoss)}`}
        >
          {stock.gainLoss !== null
            ? stock.gainLoss >= 0
              ? "↑ Profit"
              : "↓ Loss"
            : "N/A"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-[#718a90]">
            Buy Price
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {formatMoney(stock.purchasePrice)}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#718a90]">
            CMP
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {formatMoney(stock.cmp)}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#718a90]">
            Present Value
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {formatMoney(stock.presentValue)}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#718a90]">
            Gain / Loss
          </p>
          <div className="mt-1">
            <GainLossValue
              value={stock.gainLoss}
              percentage={returnPercentage}
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-[#718a90]">
            P/E
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {formatNumber(stock.peRatio)}
          </p>
        </div>

        <div>
          <p className="text-xs text-[#718a90]">
            Portfolio
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {formatPercentage(stock.portfolioPercentage)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staleData, setStaleData] = useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [secondsUntilRefresh, setSecondsUntilRefresh] =
    useState(REFRESH_INTERVAL);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] =
    useState("All");

  const [sortKey, setSortKey] =
    useState<SortKey>("gainLoss");

  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");

  const [collapsedSectors, setCollapsedSectors] =
    useState<Record<string, boolean>>({});

  const [toast, setToast] = useState<string | null>(null);

  const loadPortfolio = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        }

        const response = await fetch(
          "/api/portfolio",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Portfolio request failed: ${response.status}`
          );
        }

        const result = await response.json();

        if (!Array.isArray(result.data)) {
          throw new Error("Invalid portfolio response");
        }

        setStocks(result.data);
        setLastUpdated(new Date());
        setSecondsUntilRefresh(REFRESH_INTERVAL);
        setError(null);
        setStaleData(false);

        if (manual) {
          setToast("Portfolio data refreshed");
        }
      } catch (err) {
        console.error(
          "Portfolio fetch failed:",
          err
        );

        /*
         * Important:
         * We do not clear the existing stocks here.
         * The last successful data remains visible.
         */
        setError(
          "Unable to update portfolio data."
        );

        setStaleData(true);

        if (manual) {
          setToast(
            "Refresh failed — showing last available data"
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPortfolio();

    const interval = setInterval(() => {
      loadPortfolio();
    }, REFRESH_INTERVAL * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [loadPortfolio]);

  /*
   * Countdown is purely a UI timer.
   * It does NOT make API requests.
   */
  useEffect(() => {
    const countdown = setInterval(() => {
      setSecondsUntilRefresh((previous) => {
        if (previous <= 1) {
          return REFRESH_INTERVAL;
        }

        return previous - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdown);
    };
  }, []);

  /*
   * Automatically hide toast messages.
   */
  useEffect(() => {
    if (!toast) return;

    const timeout = setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [toast]);

  /*
   * All sectors from the current portfolio.
   */
  const sectorNames = useMemo(() => {
    return Array.from(
      new Set(stocks.map((stock) => stock.sector))
    ).sort();
  }, [stocks]);

  /*
   * Overall portfolio totals.
   */
  const portfolioTotals = useMemo(() => {
    return stocks.reduce(
      (totals, stock) => {
        totals.investment += stock.investment;
        totals.presentValue +=
          stock.presentValue ?? 0;
        totals.gainLoss +=
          stock.gainLoss ?? 0;

        return totals;
      },
      {
        investment: 0,
        presentValue: 0,
        gainLoss: 0,
      }
    );
  }, [stocks]);

  const overallReturnPercentage = useMemo(() => {
    if (!portfolioTotals.investment) {
      return 0;
    }

    return (
      (portfolioTotals.gainLoss /
        portfolioTotals.investment) *
      100
    );
  }, [portfolioTotals]);

  /*
   * Best performing stock.
   */
  const bestPerformer = useMemo(() => {
    return stocks.reduce<Stock | null>(
      (best, stock) => {
        if (stock.gainLoss === null) {
          return best;
        }

        if (
          !best ||
          (best.gainLoss ?? -Infinity) <
            stock.gainLoss
        ) {
          return stock;
        }

        return best;
      },
      null
    );
  }, [stocks]);

  /*
   * Worst performing stock.
   */
  const worstPerformer = useMemo(() => {
    return stocks.reduce<Stock | null>(
      (worst, stock) => {
        if (stock.gainLoss === null) {
          return worst;
        }

        if (
          !worst ||
          (worst.gainLoss ?? Infinity) >
            stock.gainLoss
        ) {
          return stock;
        }

        return worst;
      },
      null
    );
  }, [stocks]);

  /*
   * Sector grouping.
   */
  const sectors = useMemo(() => {
    return stocks.reduce<Record<string, Stock[]>>(
      (groups, stock) => {
        if (!groups[stock.sector]) {
          groups[stock.sector] = [];
        }

        groups[stock.sector].push(stock);

        return groups;
      },
      {}
    );
  }, [stocks]);

  /*
   * Sector allocation for the donut chart.
   */
  const allocationData = useMemo(() => {
    if (!portfolioTotals.investment) {
      return [];
    }

    return Object.entries(sectors).map(
      ([sector, sectorStocks]) => {
        const investment =
          sectorStocks.reduce(
            (sum, stock) =>
              sum + stock.investment,
            0
          );

        return {
          name: sector,
          value:
            (investment /
              portfolioTotals.investment) *
            100,
        };
      }
    );
  }, [sectors, portfolioTotals.investment]);

  /*
   * Sector performance.
   */
  const sectorPerformance = useMemo(() => {
    return Object.entries(sectors)
      .map(([sector, sectorStocks]) => {
        const investment =
          sectorStocks.reduce(
            (sum, stock) =>
              sum + stock.investment,
            0
          );

        const gainLoss =
          sectorStocks.reduce(
            (sum, stock) =>
              sum + (stock.gainLoss ?? 0),
            0
          );

        const percentage =
          investment > 0
            ? (gainLoss / investment) * 100
            : 0;

        return {
          sector,
          investment,
          gainLoss,
          percentage,
        };
      })
      .sort(
        (a, b) =>
          b.percentage - a.percentage
      );
  }, [sectors]);

  /*
   * Search + sector filtering.
   */
  const filteredStocks = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    return stocks.filter((stock) => {
      const matchesSearch =
        !query ||
        stock.name
          .toLowerCase()
          .includes(query) ||
        stock.exchangeCode
          .toLowerCase()
          .includes(query);

      const matchesSector =
        selectedSector === "All" ||
        stock.sector === selectedSector;

      return (
        matchesSearch &&
        matchesSector
      );
    });
  }, [
    stocks,
    searchQuery,
    selectedSector,
  ]);

  /*
   * Sort filtered holdings.
   */
  const sortedStocks = useMemo(() => {
    return [...filteredStocks].sort(
      (a, b) => {
        let comparison = 0;

        if (sortKey === "name") {
          comparison =
            a.name.localeCompare(b.name);
        } else {
          const aValue =
            a[sortKey] ?? -Infinity;
          const bValue =
            b[sortKey] ?? -Infinity;

          if (
            typeof aValue === "number" &&
            typeof bValue === "number"
          ) {
            comparison =
              aValue - bValue;
          }
        }

        return sortDirection === "asc"
          ? comparison
          : -comparison;
      }
    );
  }, [
    filteredStocks,
    sortKey,
    sortDirection,
  ]);

  /*
   * Group the filtered/sorted holdings
   * back into their sectors.
   */
  const filteredSectors = useMemo(() => {
    return sortedStocks.reduce<
      Record<string, Stock[]>
    >((groups, stock) => {
      if (!groups[stock.sector]) {
        groups[stock.sector] = [];
      }

      groups[stock.sector].push(stock);

      return groups;
    }, {});
  }, [sortedStocks]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((previous) =>
        previous === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortKey(key);
      setSortDirection(
        key === "name" ? "asc" : "desc"
      );
    }
  }

  function toggleSector(sector: string) {
    setCollapsedSectors((previous) => ({
      ...previous,
      [sector]: !previous[sector],
    }));
  }

  function exportCSV() {
    const headers = [
      "Particulars",
      "Sector",
      "Purchase Price",
      "Quantity",
      "Investment",
      "Portfolio %",
      "Exchange",
      "CMP",
      "Present Value",
      "Gain/Loss",
      "P/E Ratio",
      "Latest Earnings",
    ];

    const rows = stocks.map((stock) => [
      stock.name,
      stock.sector,
      stock.purchasePrice,
      stock.quantity,
      stock.investment,
      `${(stock.portfolioPercentage * 100).toFixed(2)}%`,
      stock.exchangeCode,
      stock.cmp ?? "",
      stock.presentValue ?? "",
      stock.gainLoss ?? "",
      stock.peRatio ?? "",
      stock.latestEarnings ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const cell = String(value);
            return `"${cell.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "portfolio-export.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setToast("Portfolio exported as CSV");
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (
    error &&
    stocks.length === 0
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-(--background) px-4">
        <div className="max-w-md rounded-[28px] bg-[#0c2024] p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f07878]">
            Portfolio unavailable
          </p>

          <h1 className="mt-3 font-display text-3xl">
            Something went wrong
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#8da4aa]">
            {error}
          </p>

          <button
            onClick={() => loadPortfolio(true)}
            className="mt-6 rounded-full bg-[#8de4f2] px-5 py-2.5 text-sm font-semibold text-[#0c2024] transition hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--background) px-4 py-8 text-[#0c2024] md:px-8">
      <div className="mx-auto max-w-[1600px]">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <header className="mb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#55747b]">
                Portfolio Analytics
              </p>

              <h1 className="font-display text-4xl leading-tight tracking-tight md:text-6xl">
                Your portfolio,
                <br />
                <span className="text-[#476a72]">
                  at a glance.
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-[#607b82] md:text-base">
                Live market performance across{" "}
                {stocks.length} holdings and{" "}
                {sectorNames.length} sectors.
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 rounded-full bg-[#0c2024] px-4 py-2 text-xs font-medium text-white ${
                    refreshing
                      ? "animate-pulse"
                      : ""
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      refreshing
                        ? "bg-[#8de4f2]"
                        : "bg-[#63d471]"
                    }`}
                  />
                  {refreshing ? "Updating" : "Live"}
                </div>

                <button
                  onClick={() =>
                    loadPortfolio(true)
                  }
                  disabled={refreshing}
                  className="flex items-center gap-2 rounded-full border border-[#c3d9de] bg-white/50 px-4 py-2 text-xs font-semibold text-[#28464d] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  >
                    ↻
                  </span>
                  Refresh
                </button>
              </div>

              <div className="text-right text-xs text-[#6d878e]">
                {lastUpdated ? (
                  <>
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString(
                      "en-IN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      }
                    )}
                    <span className="mx-2">
                      ·
                    </span>
                    Next refresh in{" "}
                    <span className="font-semibold text-[#28464d]">
                      {secondsUntilRefresh}s
                    </span>
                  </>
                ) : (
                  "Updating market data..."
                )}
              </div>
            </div>
          </div>

          {staleData && (
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#e8d59d] bg-[#fff8df] px-4 py-3 text-sm text-[#756026]">
              <span>⚠</span>
              <span>
                Live update failed. Showing the last
                successfully retrieved portfolio data.
              </span>
              <span className="ml-auto hidden rounded-full bg-[#f5e8b8] px-2.5 py-1 text-xs font-semibold sm:block">
                Cached
              </span>
            </div>
          )}
        </header>

        {/* ================================================== */}
        {/* SUMMARY BENTO */}
        {/* ================================================== */}

        <section className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
          <SummaryCard
  className="xl:col-span-3"
  label="Total Investment"
  value={formatCompactMoney(
    portfolioTotals.investment
  )}
  detail={`${stocks.length} holdings`}
/>

<SummaryCard
  className="xl:col-span-3"
  label="Present Value"
  value={formatCompactMoney(
    portfolioTotals.presentValue
  )}
  detail={`${portfolioTotals.gainLoss >= 0 ? "+" : "−"}${formatCompactMoney(
    Math.abs(portfolioTotals.gainLoss)
  )} vs invested`}
  positive={portfolioTotals.gainLoss >= 0}
  negative={portfolioTotals.gainLoss < 0}
/>

<SummaryCard
  className="xl:col-span-4"
  label="Overall Return"
  value={`${overallReturnPercentage >= 0 ? "+" : ""}${overallReturnPercentage.toFixed(2)}%`}
  detail={`${formatMoney(
    Math.abs(portfolioTotals.gainLoss)
  )} ${
    portfolioTotals.gainLoss >= 0
      ? "gain"
      : "loss"
  }`}
  positive={portfolioTotals.gainLoss >= 0}
  negative={portfolioTotals.gainLoss < 0}
/>

<SummaryCard
  className="xl:col-span-2"
  label="Best Performer"
  value={bestPerformer?.name ?? "N/A"}
  detail={
    bestPerformer
      ? `+${getReturnPercentage(
          bestPerformer
        )?.toFixed(2)}% return`
      : undefined
  }
  positive
/>
        </section>

        {/* ================================================== */}
        {/* ANALYTICS BENTO */}
        {/* ================================================== */}

        <section className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-12">

          {/* Allocation */}
          <div className="lg:col-span-5">
            <AllocationChart
              data={allocationData}
            />
          </div>

          {/* Performance */}
          <div className="rounded-[28px] bg-[#0c2024] p-6 text-white lg:col-span-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8da4aa]">
                  Sector Performance
                </p>

                <h2 className="mt-2 font-display text-2xl md:text-3xl">
                  Where you're winning
                </h2>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#17343a] text-[#8de4f2]">
                →
              </div>
            </div>

            <div className="mt-7 space-y-4">
              {sectorPerformance.map(
                (sector) => {
                  const positive =
                    sector.percentage >=
                    0;

                  const barWidth = Math.min(
                    Math.abs(
                      sector.percentage
                    ) * 3,
                    100
                  );

                  return (
                    <div
                      key={sector.sector}
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {sector.sector}
                          </p>

                          <p className="mt-0.5 text-[10px] text-[#607b82]">
                            {formatCompactMoney(
                              Math.abs(sector.gainLoss)
                            )}{" "}
                            {positive ? "gain" : "loss"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 text-sm font-semibold ${
                            positive
                              ? "text-[#63d471]"
                              : "text-[#f07878]"
                          }`}
                        >
                          {positive ? "↑" : "↓"}{" "}
                          {Math.abs(
                            sector.percentage
                          ).toFixed(2)}
                          %
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#17343a]">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            positive
                              ? "bg-[#63d471]"
                              : "bg-[#f07878]"
                          }`}
                          style={{
                            width: `${barWidth}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#112a2f] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#718a90]">
                  Best
                </p>

                <p className="mt-2 truncate font-semibold">
                  {bestPerformer?.name ??
                    "N/A"}
                </p>

                <p className="mt-1 text-sm text-[#63d471]">
                  ↑{" "}
                  {formatMoney(
                    bestPerformer?.gainLoss ??
                      null
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-[#112a2f] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[#718a90]">
                  Needs attention
                </p>

                <p className="mt-2 truncate font-semibold">
                  {worstPerformer?.name ??
                    "N/A"}
                </p>

                <p className="mt-1 text-sm text-[#f07878]">
                  ↓{" "}
                  {formatMoney(
                    Math.abs(
                      worstPerformer?.gainLoss ??
                        0
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* HOLDINGS */}
        {/* ================================================== */}

        <section className="overflow-hidden rounded-[28px] bg-[#0c2024] text-white">

          {/* Holdings header */}
          <div className="border-b border-[#1d393e] p-6 md:p-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8da4aa]">
                  Holdings
                </p>

                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  <h2 className="font-display text-3xl md:text-4xl">
                    Your positions
                  </h2>

                  <span className="rounded-full bg-[#17343a] px-3 py-1 text-xs text-[#8da4aa]">
                    {sortedStocks.length} shown
                  </span>
                </div>
              </div>

              {/* Search/filter controls */}
              <div className="flex flex-col gap-2 sm:flex-row">

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#718a90]">
                    ⌕
                  </span>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(
                        event.target.value
                      )
                    }
                    placeholder="Search stocks..."
                    className="h-11 w-full rounded-full border border-[#29464c] bg-[#112a2f] pl-10 pr-4 text-sm text-white outline-none placeholder:text-[#607b82] focus:border-[#8de4f2] sm:w-60"
                  />
                </div>

                <select
                  value={selectedSector}
                  onChange={(event) =>
                    setSelectedSector(
                      event.target.value
                    )
                  }
                  className="h-11 rounded-full border border-[#29464c] bg-[#112a2f] px-4 text-sm text-white outline-none focus:border-[#8de4f2]"
                >
                  <option value="All">
                    All sectors
                  </option>

                  {sectorNames.map(
                    (sector) => (
                      <option
                        key={sector}
                        value={sector}
                      >
                        {sector}
                      </option>
                    )
                  )}
                </select>

                <button
                  onClick={exportCSV}
                  className="h-11 whitespace-nowrap rounded-full border border-[#29464c] bg-[#112a2f] px-4 text-sm font-medium text-white transition hover:border-[#8de4f2] hover:text-[#8de4f2]"
                >
                  ↓ Export
                </button>
              </div>
            </div>
          </div>

          {/* Desktop holdings */}
          <div className="hidden md:block">
            <div className="max-h-175 overflow-auto">

              {Object.entries(
                filteredSectors
              ).map(
                ([sectorName, sectorStocks]) => {
                  const sectorTotals =
                    sectorStocks.reduce(
                      (totals, stock) => {
                        totals.investment +=
                          stock.investment;

                        totals.presentValue +=
                          stock.presentValue ??
                          0;

                        totals.gainLoss +=
                          stock.gainLoss ??
                          0;

                        return totals;
                      },
                      {
                        investment: 0,
                        presentValue: 0,
                        gainLoss: 0,
                      }
                    );

                  const sectorReturn =
                    sectorTotals.investment >
                    0
                      ? (sectorTotals.gainLoss /
                          sectorTotals.investment) *
                        100
                      : 0;

                  const collapsed =
                    collapsedSectors[
                      sectorName
                    ];

                  return (
                    <div
                      key={sectorName}
                      className="border-b border-[#1d393e] last:border-b-0"
                    >

                      {/* Sector header */}
                      <button
                        onClick={() =>
                          toggleSector(
                            sectorName
                          )
                        }
                        className="sticky top-0 z-10 flex w-full items-center gap-4 bg-[#0c2024] px-6 py-5 text-left transition hover:bg-[#10282d]"
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#17343a] text-[#8de4f2] transition-transform duration-200 ${
                            collapsed
                              ? ""
                              : "rotate-90"
                          }`}
                        >
                          →
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">
                              {sectorName}
                            </h3>

                            <span className="rounded-full bg-[#17343a] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#8da4aa]">
                              {
                                sectorStocks.length
                              }{" "}
                              holdings
                            </span>
                          </div>
                        </div>

                        <div className="hidden items-center gap-7 lg:flex">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[#607b82]">
                              Invested
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {formatCompactMoney(
                                sectorTotals.investment
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-[#607b82]">
                              Value
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {formatCompactMoney(
                                sectorTotals.presentValue
                              )}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider text-[#607b82]">
                              Return
                            </p>

                            <p
                              className={`mt-1 text-sm font-semibold ${getGainColor(
                                sectorTotals.gainLoss
                              )}`}
                            >
                              {sectorReturn >=
                              0
                                ? "↑"
                                : "↓"}{" "}
                              {Math.abs(
                                sectorReturn
                              ).toFixed(2)}
                              %
                            </p>
                          </div>
                        </div>
                      </button>

                      {!collapsed && (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-287.5 text-sm">
                            <thead className="top-18.25 z-10 bg-[#10282d] text-left text-[10px] uppercase tracking-[0.12em] text-[#718a90]">
                              <tr>
                                <th className="px-6 py-3">
                                  <button
                                    onClick={() =>
                                      handleSort(
                                        "name"
                                      )
                                    }
                                    className="flex items-center whitespace-nowrap"
                                  >
                                    Stock
                                    <SortIcon
                                      active={
                                        sortKey ===
                                        "name"
                                      }
                                      direction={
                                        sortDirection
                                      }
                                    />
                                  </button>
                                </th>

                                <th className="px-4 py-3">
                                  Buy Price
                                </th>

                                <th className="px-4 py-3">
                                  Qty
                                </th>

                                <th className="px-4 py-3">
                                  <button
                                    onClick={() =>
                                      handleSort(
                                        "investment"
                                      )
                                    }
                                  >
                                    Investment
                                    <SortIcon
                                      active={
                                        sortKey ===
                                        "investment"
                                      }
                                      direction={
                                        sortDirection
                                      }
                                    />
                                  </button>
                                </th>

                                <th className="px-4 py-3">
                                  <button
                                    onClick={() =>
                                      handleSort(
                                        "portfolioPercentage"
                                      )
                                    }
                                  >
                                    Portfolio %
                                    <SortIcon
                                      active={
                                        sortKey ===
                                        "portfolioPercentage"
                                      }
                                      direction={
                                        sortDirection
                                      }
                                    />
                                  </button>
                                </th>

                                <th className="px-4 py-3">
                                  CMP
                                </th>

                                <th className="px-4 py-3">
                                  <button
                                    onClick={() =>
                                      handleSort(
                                        "presentValue"
                                      )
                                    }
                                  >
                                    Present Value
                                    <SortIcon
                                      active={
                                        sortKey ===
                                        "presentValue"
                                      }
                                      direction={
                                        sortDirection
                                      }
                                    />
                                  </button>
                                </th>

                                <th className="px-4 py-3">
                                  <button
                                    onClick={() =>
                                      handleSort(
                                        "gainLoss"
                                      )
                                    }
                                  >
                                    Gain / Loss
                                    <SortIcon
                                      active={
                                        sortKey ===
                                        "gainLoss"
                                      }
                                      direction={
                                        sortDirection
                                      }
                                    />
                                  </button>
                                </th>

                                <th className="px-4 py-3">
                                  <button
                                    onClick={() =>
                                      handleSort(
                                        "peRatio"
                                      )
                                    }
                                  >
                                    P/E
                                    <SortIcon
                                      active={
                                        sortKey ===
                                        "peRatio"
                                      }
                                      direction={
                                        sortDirection
                                      }
                                    />
                                  </button>
                                </th>

                                <th className="px-4 py-3">
                                  Earnings
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {sectorStocks.map(
                                (stock) => {
                                  const returnPercentage =
                                    getReturnPercentage(
                                      stock
                                    );

                                  return (
                                    <tr
                                      key={
                                        stock.id
                                      }
                                      className="border-t border-[#1b363b] transition-colors duration-200 hover:bg-[#112a2f]"
                                    >
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#17343a] text-xs font-semibold text-[#8de4f2]">
                                            {stock.name
                                              .slice(
                                                0,
                                                2
                                              )
                                              .toUpperCase()}
                                          </div>

                                          <div>
                                            <p className="font-medium text-white">
                                              {
                                                stock.name
                                              }
                                            </p>

                                            <p className="mt-0.5 text-[10px] text-[#607b82]">
                                              {
                                                stock.exchangeCode
                                              }
                                            </p>
                                          </div>
                                        </div>
                                      </td>

                                      <td className="px-4 py-4 text-[#b4c7cb]">
                                        {formatMoney(
                                          stock.purchasePrice
                                        )}
                                      </td>

                                      <td className="px-4 py-4 text-[#b4c7cb]">
                                        {formatNumber(
                                          stock.quantity
                                        )}
                                      </td>

                                      <td className="px-4 py-4 text-[#b4c7cb]">
                                        {formatMoney(
                                          stock.investment
                                        )}
                                      </td>

                                      <td className="px-4 py-4 text-[#b4c7cb]">
                                        {formatPercentage(
                                          stock.portfolioPercentage
                                        )}
                                      </td>

                                      <td className="px-4 py-4">
                                        <span className="rounded-full bg-[#17343a] px-2.5 py-1 text-[10px] font-semibold text-[#8da4aa]">
                                          {
                                            stock.exchangeCode
                                          }
                                        </span>
                                      </td>

                                      <td className="px-4 py-4 font-semibold text-white">
                                        {formatMoney(
                                          stock.cmp
                                        )}
                                      </td>

                                      <td className="px-4 py-4 font-medium text-white">
                                        {formatMoney(
                                          stock.presentValue
                                        )}
                                      </td>

                                      <td className="px-4 py-4">
                                        <GainLossValue
                                          value={
                                            stock.gainLoss
                                          }
                                          percentage={
                                            returnPercentage
                                          }
                                        />
                                      </td>

                                      <td className="px-4 py-4 text-[#b4c7cb]">
                                        {formatNumber(
                                          stock.peRatio
                                        )}
                                      </td>

                                      <td className="px-4 py-4 text-[#b4c7cb]">
                                        {formatNumber(
                                          stock.latestEarnings
                                        )}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                }
              )}

              {Object.keys(
                filteredSectors
              ).length === 0 && (
                <div className="px-6 py-16 text-center">
                  <p className="font-display text-2xl">
                    No holdings found
                  </p>

                  <p className="mt-2 text-sm text-[#718a90]">
                    Try a different search or
                    sector filter.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ================================================== */}
          {/* MOBILE HOLDINGS */}
          {/* ================================================== */}

          <div className="space-y-3 p-4 md:hidden">
            {Object.entries(
              filteredSectors
            ).map(
              ([sectorName, sectorStocks]) => {
                const collapsed =
                  collapsedSectors[
                    sectorName
                  ];

                return (
                  <div
                    key={sectorName}
                    className="rounded-2xl bg-[#10282d] p-3"
                  >
                    <button
                      onClick={() =>
                        toggleSector(
                          sectorName
                        )
                      }
                      className="flex w-full items-center gap-3 p-2 text-left"
                    >
                      <span
                        className={`transition-transform ${
                          collapsed
                            ? ""
                            : "rotate-90"
                        }`}
                      >
                        →
                      </span>

                      <span className="flex-1 font-semibold">
                        {sectorName}
                      </span>

                      <span className="text-xs text-[#718a90]">
                        {
                          sectorStocks.length
                        }
                      </span>
                    </button>

                    {!collapsed && (
                      <div className="mt-2 space-y-2">
                        {sectorStocks.map(
                          (stock) => (
                            <MobileStockCard
                              key={stock.id}
                              stock={stock}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )}

            {Object.keys(
              filteredSectors
            ).length === 0 && (
              <div className="py-12 text-center">
                <p className="font-display text-2xl">
                  No holdings found
                </p>

                <p className="mt-2 text-sm text-[#718a90]">
                  Try a different search or
                  filter.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-2 border-t border-[#1d393e] px-6 py-4 text-xs text-[#607b82] sm:flex-row sm:items-center sm:justify-between">
            <span>
              Market data refreshes every{" "}
              {REFRESH_INTERVAL} seconds
            </span>

            <span>
              {stocks.length} total holdings
            </span>
          </div>
        </section>
      </div>

      {/* ================================================== */}
      {/* TOAST */}
      {/* ================================================== */}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-[#0c2024] px-5 py-3 text-sm font-medium text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#63d471]" />
            {toast}
          </div>
        </div>
      )}
    </main>
  );
}