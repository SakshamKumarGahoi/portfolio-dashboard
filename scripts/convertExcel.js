const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const workbook = XLSX.readFile(
  "F9001561_ADDBA737E8_B72562937A.xlsx"
);

const sheet = workbook.Sheets[workbook.SheetNames[0]];

const rows = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  defval: null,
});

const stocks = [];

/*
 * Explicit sector mapping.
 *
 * We use this instead of relying on the position of
 * "Sector" rows in Excel so that our application data
 * always has the correct sector.
 */
const sectorMap = {
  "HDFC Bank": "Financial",
  "Bajaj Finance": "Financial",
  "ICICI Bank": "Financial",
  "Bajaj Housing": "Financial",
  "Savani Financials": "Financial",

  "Affle India": "Tech",
  "LTI Mindtree": "Tech",
  "KPIT Tech": "Tech",
  "Tata Tech": "Tech",
  "BLS E-Services": "Tech",
  "Tanla": "Tech",

  "Dmart": "Consumer",
  "Tata Consumer": "Consumer",
  "Pidilite": "Consumer",

  "Tata Power": "Power",
  "KPI Green": "Power",
  "Suzlon": "Power",
  "Gensol": "Power",

  "Hariom Pipes": "Pipe",
  "Astral": "Pipe",
  "Polycab": "Pipe",

  "Clean Science": "Others",
  "Deepak Nitrite": "Others",
  "Fine Organic": "Others",
  "Gravita": "Others",
  "SBI Life": "Others",
  "Infy": "Others",
  "Happeist Mind": "Others",
  "Easemytrip": "Others",
};

const symbolMap = {
  "HDFC Bank": "HDFCBANK.NS",
  "Bajaj Finance": "BAJFINANCE.NS",
  "ICICI Bank": "ICICIBANK.NS",
  "Bajaj Housing": "BAJAJHFL.NS",
  "Savani Financials": null,

  "Affle India": "AFFLE.NS",
  "LTI Mindtree": "LTM.NS",
  "KPIT Tech": "KPITTECH.NS",
  "Tata Tech": "TATATECH.NS",
  "BLS E-Services": "BLS.NS",
  "Tanla": "TANLA.NS",

  "Dmart": "DMART.NS",
  "Tata Consumer": "TATACONSUM.NS",
  "Pidilite": "PIDILITIND.NS",

  "Tata Power": "TATAPOWER.NS",
  "KPI Green": "KPIGREEN.NS",
  "Suzlon": "SUZLON.NS",
  "Gensol": "GENSOL.NS",

  "Hariom Pipes": "HARIOMPIPE.NS",
  "Astral": "ASTRAL.NS",
  "Polycab": "POLYCAB.NS",

  "Clean Science": "CLEAN.NS",
  "Deepak Nitrite": "DEEPAKNTR.NS",
  "Fine Organic": "FINEORG.NS",
  "Gravita": "GRAVITA.NS",
  "SBI Life": "SBILIFE.NS",

  "Infy": "INFY.NS",
  "Happeist Mind": "HAPPSTMNDS.NS",
  "Easemytrip": "EASEMYTRIP.NS",
};

const googleMap = {
  "HDFC Bank": "HDFCBANK:NSE",
  "Bajaj Finance": "BAJFINANCE:NSE",
  "ICICI Bank": "ICICIBANK:NSE",
  "Bajaj Housing": "BAJAJHFL:NSE",
  "Savani Financials": null,

  "Affle India": "AFFLE:NSE",
  "LTI Mindtree": "LTM:NSE",
  "KPIT Tech": "KPITTECH:NSE",
  "Tata Tech": "TATATECH:NSE",
  "BLS E-Services": "BLS:NSE",
  "Tanla": "TANLA:NSE",

  "Dmart": "DMART:NSE",
  "Tata Consumer": "TATACONSUM:NSE",
  "Pidilite": "PIDILITIND:NSE",

  "Tata Power": "TATAPOWER:NSE",
  "KPI Green": "KPIGREEN:NSE",
  "Suzlon": "SUZLON:NSE",
  "Gensol": "GENSOL:NSE",

  "Hariom Pipes": "HARIOMPIPE:NSE",
  "Astral": "ASTRAL:NSE",
  "Polycab": "POLYCAB:NSE",

  "Clean Science": "CLEAN:NSE",
  "Deepak Nitrite": "DEEPAKNTR:NSE",
  "Fine Organic": "FINEORG:NSE",
  "Gravita": "GRAVITA:NSE",
  "SBI Life": "SBILIFE:NSE",

  "Infy": "INFY:NSE",
  "Happeist Mind": "HAPPSTMNDS:NSE",
  "Easemytrip": "EASEMYTRIP:NSE",
};

for (let i = 2; i < rows.length; i++) {
  const row = rows[i];

  if (!row) continue;

  /*
   * Trim the company name.
   *
   * This fixes Excel values such as:
   * "Tanla "
   * becoming:
   * "Tanla"
   */
  const name =
    typeof row[1] === "string"
      ? row[1].trim()
      : row[1];

  /*
   * Ignore sector header rows.
   */
  if (
    typeof name === "string" &&
    name.endsWith("Sector")
  ) {
    continue;
  }

  /*
   * Ignore rows that aren't actual holdings.
   */
  if (
    typeof name !== "string" ||
    row[2] === null ||
    row[3] === null
  ) {
    continue;
  }

  const purchasePrice = Number(row[2]);
  const quantity = Number(row[3]);
  const investment = Number(row[4]);

  /*
   * Ignore malformed rows.
   */
  if (
    !Number.isFinite(purchasePrice) ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(investment)
  ) {
    continue;
  }

  stocks.push({
    id: stocks.length + 1,

    name,

    sector: sectorMap[name] || "Others",

    purchasePrice,
    quantity,
    investment,

    portfolioPercentage: Number(row[5]),

    exchangeCode: String(row[6]),

    yahooSymbol: symbolMap[name] ?? null,

    googleSymbol: googleMap[name] ?? null,

    /*
     * These are the initial values from Excel.
     * The API will replace CMP / Present Value /
     * Gain-Loss with live Yahoo values.
     */
    cmp: Number(row[7]) || null,

    presentValue: Number(row[8]) || null,

    gainLoss: Number(row[9]) || null,

    /*
     * Excel P/E.
     *
     * If Excel contains "#N/A", this becomes null.
     */
    peRatio: Number.isFinite(Number(row[12]))
      ? Number(row[12])
      : null,

    /*
     * Excel Latest Earnings / EPS.
     */
    latestEarnings: Number.isFinite(Number(row[13]))
      ? Number(row[13])
      : null,
  });
}

const outputPath = path.join(
  __dirname,
  "../src/data/portfolio.json"
);

fs.writeFileSync(
  outputPath,
  JSON.stringify(stocks, null, 2)
);

console.log(`Created ${stocks.length} stocks.`);

console.log("\nSector distribution:");

const sectorCounts = stocks.reduce(
  (acc, stock) => {
    acc[stock.sector] =
      (acc[stock.sector] || 0) + 1;

    return acc;
  },
  {}
);

console.table(sectorCounts);