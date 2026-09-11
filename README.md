# Portfolio Dashboard

A portfolio monitoring dashboard built with Next.js, React, TypeScript and Tailwind CSS.

The application takes portfolio holdings from an Excel sheet, converts the relevant records into JSON, retrieves market data from Yahoo Finance and Google Finance, and displays the portfolio in a grouped dashboard. Market values are refreshed periodically and the API uses a short-lived cache to avoid making external requests on every browser request.

## Features

- Portfolio holdings table with:
  - Particulars
  - Purchase Price
  - Quantity
  - Investment
  - Portfolio Percentage
  - NSE/BSE code
  - CMP
  - Present Value
  - Gain/Loss
  - P/E Ratio
  - Latest Earnings / EPS value
- Portfolio grouped by sector
- Sector-level investment, present value and gain/loss totals
- Portfolio allocation chart
- Sector performance view
- Search by stock name
- Sector filtering
- Column sorting
- Responsive desktop and mobile layouts
- Live refresh with a 15-second interval
- 15-second server-side in-memory cache
- Fallback to stored portfolio values when an external market-data request fails
- CSV export
- Loading, refresh and stale-data states

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts
- Node.js
- xlsx for Excel conversion

## Project Structure

```text
portfolio-dashboard/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── portfolio/
│   │   │       └── route.ts
│   │   ├── globals.css
│   │   └── page.tsx
│   ├── components/
│   │   ├── allocation-chart.tsx
│   │   └── summary-card.tsx
│   ├── data/
│   │   └── portfolio.json
│   ├── lib/
│   │   ├── cache.ts
│   │   └── marketData.ts
│   └── types/
│       └── portfolio.ts
├── scripts/
│   └── convertExcel.js
├── package.json
└── README.md
```

## Data Flow

The application follows this flow:

```text
Excel portfolio
      |
      v
convertExcel.js
      |
      v
portfolio.json
      |
      v
Next.js API route
      |
      +------------------+
      |                  |
      v                  v
Yahoo Finance       Google Finance
CMP                 P/E and EPS
      |                  |
      +--------+---------+
               |
               v
        Portfolio response
               |
               v
          React dashboard
               |
       +-------+-------+
       |       |       |
       v       v       v
     Table   Charts   Export
```

The browser does not call Yahoo Finance or Google Finance directly. It requests `/api/portfolio`, and the server handles the external data requests.

## Portfolio Data Preparation

The supplied Excel workbook contains the portfolio information. The conversion script reads the required rows and creates `src/data/portfolio.json`.

The conversion step also maps each holding to its sector and assigns the corresponding exchange symbols used by the external market-data sources.

Run the conversion script when the source Excel data needs to be regenerated.

```bash
node scripts/convertExcel.js
```

The generated JSON contains the static portfolio information and the symbols required for live market-data requests.

## Market Data

### Yahoo Finance

Yahoo Finance is used for the current market price (CMP).

The API requests the Yahoo Finance chart endpoint for each Yahoo symbol and reads the `regularMarketPrice` value from the response.

The current implementation sends requests from the Next.js server rather than from the browser.

### Google Finance

Google Finance is used for the P/E ratio and the displayed earnings metric.

The application requests the relevant Google Finance quote page and extracts the visible P/E ratio and EPS values from the returned HTML.

The field displayed as Latest Earnings is therefore based on the EPS value exposed by Google Finance. It is not a separate earnings-report API.

Because this is an unofficial scraping approach, the parsing logic may need adjustment if Google changes its page structure.

## API Route

The main backend endpoint is:

```text
GET /api/portfolio
```

The endpoint performs the following steps:

1. Checks whether a valid cached portfolio exists.
2. Returns the cached response if it has not expired.
3. Loads the static portfolio records.
4. Requests Yahoo CMP and Google Finance data for each holding.
5. Performs independent external requests concurrently.
6. Calculates Present Value using:

```text
Present Value = CMP × Quantity
```

7. Calculates Gain/Loss using:

```text
Gain/Loss = Present Value − Investment
```

8. Falls back to the stored value when an external value is unavailable.
9. Stores the updated portfolio in the cache.
10. Returns the portfolio to the frontend.

## Concurrent Requests

The API uses `Promise.all` at two levels.

For each stock, Yahoo and Google requests can execute concurrently because neither depends on the other.

The portfolio also processes multiple stocks concurrently.

This avoids unnecessarily waiting for one network request to finish before starting another.

The approach can be summarized as:

```text
Stock 1: Yahoo + Google
Stock 2: Yahoo + Google
Stock 3: Yahoo + Google
...
```

rather than processing every external request strictly one after another.

## Caching

The API uses a simple in-memory cache with a 15-second TTL.

```text
Request
   |
   v
Cache lookup
   |
   +---- valid ----> return cached data
   |
   +---- expired --> fetch market data
                         |
                         v
                    update cache
                         |
                         v
                    return data
```

The cache reduces repeated calls to Yahoo Finance and Google Finance while still allowing the displayed market data to update frequently.

This implementation is appropriate for the assignment and a single running application instance. For a production deployment with multiple server instances or serverless scaling, a shared cache such as Redis would be more appropriate because an in-memory cache is local to one process.

## Frontend Refresh

The dashboard polls the API every 15 seconds.

The browser does not independently request each market-data source. Instead, it calls:

```text
/api/portfolio
```

The API decides whether it needs to contact the external sources or can return its cached result.

A countdown and last-updated value are displayed in the interface so the refresh state is visible.

## Error Handling

External market-data services are not treated as guaranteed dependencies.

If a Yahoo Finance request fails, the application keeps the previous CMP when one is available.

If Google Finance does not return a P/E or EPS value, the application keeps the value already stored in the portfolio data.

This allows the dashboard to continue displaying useful portfolio information even when one external source is unavailable.

The frontend also retains previously loaded data when a later refresh fails, rather than replacing the entire dashboard with an empty state.

## Sector Calculations

The dashboard derives sector-level information from the individual holdings.

For each sector:

```text
Total Investment = sum of holding investments
Total Present Value = sum of holding present values
Gain/Loss = Total Present Value − Total Investment
```

Portfolio allocation is based on each sector's investment relative to total portfolio investment.

Individual portfolio percentage values are displayed from the portfolio data after the percentage representation is normalized for display.

## CSV Export

The dashboard includes a client-side CSV export option.

The exported file contains the currently available portfolio records and their displayed values.

No additional external request is required to create the CSV.

## Running the Project

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

For a production build:

```bash
npm run build
```

To start the production server after building:

```bash
npm start
```

## Environment Variables

The current implementation does not require API keys for Yahoo Finance or Google Finance because it uses their publicly accessible endpoints/pages.

If the application is later migrated to an authenticated market-data provider, credentials should be stored as server-side environment variables and should not be exposed to the browser.

## Important Limitations

The market-data sources used by this project are unofficial.

Yahoo Finance endpoints and Google Finance page structures can change without notice.

Google Finance scraping is particularly dependent on the structure of the returned HTML. If the page changes, the extraction expressions may stop finding P/E or EPS.

The in-memory cache is process-local. It is not a shared cache across multiple application instances.

The application also depends on the external services being reachable from the server.

These limitations are acceptable for the assignment but would need to be addressed for a production financial application.

## Validation

Before submission, verify:

- `npm run build` completes successfully
- Portfolio records load correctly
- Sector grouping is correct
- CMP values are displayed
- Present Value and Gain/Loss are calculated
- P/E and earnings/EPS values are displayed where available
- 15-second refresh works
- Search and filtering work
- Sorting works
- CSV export works
- Mobile layout works
- External-data failures do not clear the existing portfolio

## Design Decisions

The project keeps static portfolio information separate from live market data.

The Excel file is converted once into JSON rather than being parsed during every dashboard request.

External market-data requests are kept on the server so the browser only communicates with the application's API.

Short-lived caching limits unnecessary external requests.

Concurrent requests reduce the total time needed to collect data from multiple holdings.

Fallback values prevent a temporary external API or scraping failure from making the dashboard unusable.

## Future Improvements

For a production version, the following changes would be reasonable:

- Replace unofficial scraping with a licensed market-data provider.
- Use Redis or another shared cache.
- Add request batching where supported by the data provider.
- Add stronger schema validation for external responses.
- Add automated tests for market-data parsing and portfolio calculations.
- Add monitoring for external API failures and response changes.
- Add authentication and authorization if the dashboard contains private portfolios.
- Move portfolio data to a database instead of a generated JSON file.
