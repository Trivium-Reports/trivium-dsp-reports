/**
 * Amazon Sponsored Ads — Conversion Path report parser.
 *
 * Mirai Clinical is the only brand currently subscribed to this report.
 * Source: weekly "Mirai: All Amazon campaigns Conversion path report" emails
 * to ppc@triviumco.com, "Last 30 days" window.
 *
 * The exact CSV schema from Amazon's UI hasn't been frozen in the codebase
 * yet — Amazon occasionally renames columns ("Path" vs "Conversion path"
 * vs "Touchpoint sequence"). This parser detects columns by best-fit name
 * matching so the dashboard keeps working through schema drift.
 *
 * Expected (or best-effort) columns:
 *   - Path / Conversion path / Touchpoint sequence  → string
 *   - Conversions / Path conversions                 → number
 *   - Sales / Path sales / Sales (USD)               → number
 *   - Spend / Path spend / Total spend               → number
 *   - ROAS / Path ROAS                               → number (else derived)
 *   - Conversion rate / Path conversion rate (%)     → number (else derived)
 *   - Path length / Touchpoints / # touchpoints      → number
 *   - Time to conversion / Days to conversion        → number (days)
 */

export interface ConvPathRow {
  path: string;
  conversions: number;
  sales: number;
  spend: number;
  roas: number;
  convRatePct: number;
  pathLength: number;
  timeToConvDays: number;
  raw: Record<string, string>;
}

export interface ConvPathSummary {
  rows: ConvPathRow[];
  totals: {
    conversions: number;
    sales: number;
    spend: number;
    roas: number;
  };
  topByConversions: ConvPathRow[];
  topBySales: ConvPathRow[];
  dspInvolvedShare: {
    pathCount: number;
    convCount: number;
    salesUsd: number;
    pctOfPaths: number;
    pctOfConversions: number;
    pctOfSales: number;
  };
  spInvolvedShare: {
    pathCount: number;
    convCount: number;
    salesUsd: number;
    pctOfPaths: number;
    pctOfConversions: number;
    pctOfSales: number;
  };
  multiTouchShare: {
    pathCount: number;
    convCount: number;
    pctOfPaths: number;
    pctOfConversions: number;
  };
  hasUsefulData: boolean;
  rawColumnNames: string[];
}

/* ── Column resolution ─────────────────────────────────────── */

const COL = {
  path: ["path", "conversion path", "touchpoint sequence", "touch points", "touchpoints"],
  conversions: ["conversions", "path conversions", "total conversions", "purchases"],
  sales: ["sales", "path sales", "sales (usd)", "sales usd", "total sales", "total sales (usd)"],
  spend: ["spend", "path spend", "total spend", "cost", "total cost"],
  roas: ["roas", "path roas", "return on ad spend"],
  convRate: ["conversion rate", "path conversion rate", "conversion rate (%)", "cvr"],
  pathLength: ["path length", "touchpoints", "# touchpoints", "number of touchpoints", "length"],
  timeToConv: ["time to conversion", "days to conversion", "average time to conversion", "avg time to conversion (days)"],
} as const;

function findColumn(headers: string[], candidates: readonly string[]): string | null {
  const lower = headers.map(h => h.toLowerCase().trim());
  for (const c of candidates) {
    const i = lower.indexOf(c);
    if (i !== -1) return headers[i];
  }
  // Fuzzy: any header that CONTAINS one of the candidates
  for (const c of candidates) {
    const i = lower.findIndex(h => h.includes(c));
    if (i !== -1) return headers[i];
  }
  return null;
}

function num(s: string | undefined | null): number {
  if (s === undefined || s === null) return 0;
  const cleaned = String(s).replace(/^="/, "").replace(/"$/, "")
    .replace(/[,$%]/g, "").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/* ── CSV parsing (handles quoted fields with embedded commas) ── */

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let i = 0;
  let cur = "";
  let inQuotes = false;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 2;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        i++;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      out.push(cur);
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  out.push(cur);
  return out;
}

function parseCsv(raw: string): Record<string, string>[] {
  const cleaned = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const cells = parseCsvLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? "").trim(); });
    return obj;
  });
}

/* ── Public parser ─────────────────────────────────────────── */

export function parseConvPathReport(raw: string): ConvPathSummary {
  const rows = parseCsv(raw);
  if (rows.length === 0) {
    return emptySummary([]);
  }
  const headers = Object.keys(rows[0]);

  const colPath = findColumn(headers, COL.path);
  const colConv = findColumn(headers, COL.conversions);
  const colSales = findColumn(headers, COL.sales);
  const colSpend = findColumn(headers, COL.spend);
  const colRoas = findColumn(headers, COL.roas);
  const colConvRate = findColumn(headers, COL.convRate);
  const colLen = findColumn(headers, COL.pathLength);
  const colTime = findColumn(headers, COL.timeToConv);

  const parsed: ConvPathRow[] = rows.map(r => {
    const path = colPath ? r[colPath] : "";
    const conversions = colConv ? num(r[colConv]) : 0;
    const sales = colSales ? num(r[colSales]) : 0;
    const spend = colSpend ? num(r[colSpend]) : 0;
    const roasRaw = colRoas ? num(r[colRoas]) : 0;
    const cvrRaw = colConvRate ? num(r[colConvRate]) : 0;
    const lengthRaw = colLen ? num(r[colLen]) : guessPathLength(path);
    const time = colTime ? num(r[colTime]) : 0;
    const roas = roasRaw > 0 ? roasRaw : spend > 0 ? sales / spend : 0;
    const cvr = cvrRaw > 0 ? cvrRaw : 0;
    return {
      path, conversions, sales, spend, roas,
      convRatePct: cvr, pathLength: lengthRaw, timeToConvDays: time,
      raw: r,
    };
  });

  const totalConv = parsed.reduce((s, r) => s + r.conversions, 0);
  const totalSales = parsed.reduce((s, r) => s + r.sales, 0);
  const totalSpend = parsed.reduce((s, r) => s + r.spend, 0);
  const totalRoas = totalSpend > 0 ? totalSales / totalSpend : 0;

  const topByConversions = [...parsed]
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 10);
  const topBySales = [...parsed]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);

  const isDsp  = (r: ConvPathRow) => /dsp/i.test(r.path) || /display/i.test(r.path);
  const isSp   = (r: ConvPathRow) =>
    /\bSP\b|sponsored|sb\b|sd\b|search/i.test(r.path);
  const isMulti = (r: ConvPathRow) => r.pathLength >= 2;

  const dspRows = parsed.filter(isDsp);
  const spRows = parsed.filter(isSp);
  const multiRows = parsed.filter(isMulti);
  const totalPaths = parsed.length;

  const summary: ConvPathSummary = {
    rows: parsed,
    totals: {
      conversions: totalConv,
      sales: totalSales,
      spend: totalSpend,
      roas: totalRoas,
    },
    topByConversions,
    topBySales,
    dspInvolvedShare: shareSlice(dspRows, totalPaths, totalConv, totalSales),
    spInvolvedShare: shareSlice(spRows, totalPaths, totalConv, totalSales),
    multiTouchShare: {
      pathCount: multiRows.length,
      convCount: multiRows.reduce((s, r) => s + r.conversions, 0),
      pctOfPaths: totalPaths > 0 ? (multiRows.length / totalPaths) * 100 : 0,
      pctOfConversions: totalConv > 0
        ? (multiRows.reduce((s, r) => s + r.conversions, 0) / totalConv) * 100
        : 0,
    },
    hasUsefulData: totalConv > 0 || totalSales > 0,
    rawColumnNames: headers,
  };
  return summary;
}

function shareSlice(rows: ConvPathRow[], totalPaths: number, totalConv: number, totalSales: number) {
  const conv = rows.reduce((s, r) => s + r.conversions, 0);
  const sales = rows.reduce((s, r) => s + r.sales, 0);
  return {
    pathCount: rows.length,
    convCount: conv,
    salesUsd: sales,
    pctOfPaths: totalPaths > 0 ? (rows.length / totalPaths) * 100 : 0,
    pctOfConversions: totalConv > 0 ? (conv / totalConv) * 100 : 0,
    pctOfSales: totalSales > 0 ? (sales / totalSales) * 100 : 0,
  };
}

function guessPathLength(path: string): number {
  if (!path) return 0;
  // "A > B > C" or "A → B → C" or "A -> B -> C"
  const m = path.split(/\s*(?:>|→|->)\s*/).filter(Boolean);
  return m.length;
}

function emptySummary(headers: string[]): ConvPathSummary {
  return {
    rows: [],
    totals: { conversions: 0, sales: 0, spend: 0, roas: 0 },
    topByConversions: [],
    topBySales: [],
    dspInvolvedShare: zeroShare(),
    spInvolvedShare: zeroShare(),
    multiTouchShare: { pathCount: 0, convCount: 0, pctOfPaths: 0, pctOfConversions: 0 },
    hasUsefulData: false,
    rawColumnNames: headers,
  };
}

function zeroShare() {
  return {
    pathCount: 0, convCount: 0, salesUsd: 0,
    pctOfPaths: 0, pctOfConversions: 0, pctOfSales: 0,
  };
}
