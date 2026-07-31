/**
 * Amazon Sponsored Ads — Conversion Path report parser.
 *
 * Schema frozen 2026-07-31 against real exports (Primal Queen, Sud Scrub,
 * Dexas, Paradise Naturals, ProBiora). Amazon's export has 20 columns:
 *
 *   Start Date, End Date, Brand, Conversion path, Sales, Purchases,
 *   New-to-brand product sales, New-to-brand purchases,
 *   <11 per-ad-type "frequency" columns>, Currency
 *
 * The frequency columns are the actual signal: each row is one distinct
 * conversion path, and the frequency columns say how many times each ad type
 * appeared on it. There is NO cost/spend column, so path-level ROAS cannot be
 * computed and must never be displayed.
 *
 * Rows are grouped into three path types by which ad families appear:
 *   DSP + Sponsored Ads · Amazon DSP only · Sponsored Ads
 */

/* ── Column groups ─────────────────────────────────────────── */

const DSP_COLS = [
  "Amazon DSP display frequency",
  "Amazon DSP online video frequency",
  "Amazon DSP streaming TV frequency",
  "Amazon DSP audio frequency",
];

const SA_COLS = [
  "Sponsored Brands display frequency",
  "Sponsored Display display frequency",
  "Sponsored Brands video frequency",
  "Sponsored TV streaming TV frequency",
  "Sponsored Products frequency",
  "Sponsored Display frequency",
  "Sponsored Display online video frequency",
];

export type PathType =
  | "DSP + Sponsored Ads"
  | "Amazon DSP only"
  | "Sponsored Ads";

/** Display order — also the donut order. */
export const PATH_TYPE_ORDER: PathType[] = [
  "DSP + Sponsored Ads",
  "Amazon DSP only",
  "Sponsored Ads",
];

/** hsl() strings so the donut stays inside the report's palette. */
export const PATH_TYPE_COLORS: Record<PathType, string> = {
  "DSP + Sponsored Ads": "hsl(25, 100%, 50%)",
  "Amazon DSP only": "hsl(213, 51%, 25%)",
  "Sponsored Ads": "hsl(36, 78%, 57%)",
};

/* ── Types ─────────────────────────────────────────────────── */

export interface ConvPathRow {
  path: string;
  sales: number;
  purchases: number;
  ntbSales: number;
  ntbPurchases: number;
  /** Total ad impressions on the path (Amazon's "frequency" columns). */
  dspImpressions: number;
  saImpressions: number;
  impressions: number;
  /** Distinct ad formats present on the path. */
  dspFormats: number;
  saFormats: number;
  pathType: PathType;
  raw: Record<string, string>;
}

export interface PathTypeGroup {
  pathType: PathType;
  paths: number;
  sales: number;
  purchases: number;
  ntbSales: number;
  ntbPurchases: number;
  /** Purchase-weighted mean ad impressions on the path. */
  avgImpressions: number;
  pctOfSales: number;
  ntbSharePct: number;
  color: string;
}

/**
 * DSP contribution, expressed as a path-based floor rather than a causal claim.
 *
 * `dspExclusiveSales` = sales on paths with ZERO Sponsored Ads touch, i.e. the
 * portion Sponsored Ads had no opportunity to influence.
 * `dspAssistedSales` = sales on paths where DSP appeared alongside Sponsored Ads.
 */
export interface DspContribution {
  baselineSales: number;
  assistedSales: number;
  exclusiveSales: number;
  dspInvolvedSales: number;
  dspInvolvedPct: number;
  exclusivePct: number;
  exclusivePurchases: number;
  assistedPurchases: number;
  dspNtbPurchases: number;
  totalSales: number;
}

export interface ConvPathSummary {
  rows: ConvPathRow[];
  groups: PathTypeGroup[];
  totals: {
    paths: number;
    sales: number;
    purchases: number;
    ntbSales: number;
    ntbPurchases: number;
    ntbSharePct: number;
  };
  dsp: DspContribution;
  period: { start: string; end: string };
  currency: string;
  hasUsefulData: boolean;
  rawColumnNames: string[];
}

/* ── CSV parsing ───────────────────────────────────────────── */

function parseCsv(raw: string): Record<string, string>[] {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const lines: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); lines.push(row); row = []; field = ""; }
    else field += c;
  }
  row.push(field);
  lines.push(row);

  const headers = (lines.shift() ?? []).map(h => h.trim());
  return lines
    .filter(l => l.some(v => v.trim() !== ""))
    .map(l => {
      const o: Record<string, string> = {};
      headers.forEach((h, i) => { o[h] = (l[i] ?? "").trim(); });
      return o;
    });
}

function num(v: string | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[$,%\s]/g, "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Tolerant header lookup — Amazon varies capitalisation between exports. */
function pick(row: Record<string, string>, name: string): string | undefined {
  if (name in row) return row[name];
  const lower = name.toLowerCase();
  const hit = Object.keys(row).find(k => k.toLowerCase() === lower);
  return hit ? row[hit] : undefined;
}

/**
 * Classify by how many distinct ad FORMATS appear on the path.
 *
 * The frequency columns hold average impressions per format, NOT a count of
 * touchpoints — "Sponsored Products > [Purchase]" carries a frequency of ~1.5.
 * Counting impressions here would wrongly split single-format Sponsored Ads
 * paths out as "multi-touch".
 */
function classify(dspFormats: number, saFormats: number): PathType {
  if (dspFormats > 0 && saFormats > 0) return "DSP + Sponsored Ads";
  if (dspFormats > 0) return "Amazon DSP only";
  return "Sponsored Ads";
}

/* ── Public parser ─────────────────────────────────────────── */

export function parseConvPathReport(raw: string): ConvPathSummary {
  const records = parseCsv(raw);
  if (records.length === 0) return emptySummary([]);
  const headers = Object.keys(records[0]);

  const rows: ConvPathRow[] = records
    .filter(r => (pick(r, "Conversion path") ?? "").trim() !== "")
    .map(r => {
      const dspImpressions = DSP_COLS.reduce((s, c) => s + num(pick(r, c)), 0);
      const saImpressions = SA_COLS.reduce((s, c) => s + num(pick(r, c)), 0);
      const dspFormats = DSP_COLS.filter(c => num(pick(r, c)) > 0).length;
      const saFormats = SA_COLS.filter(c => num(pick(r, c)) > 0).length;
      return {
        path: (pick(r, "Conversion path") ?? "").trim(),
        sales: num(pick(r, "Sales")),
        purchases: num(pick(r, "Purchases")),
        ntbSales: num(pick(r, "New-to-brand product sales")),
        ntbPurchases: num(pick(r, "New-to-brand purchases")),
        dspImpressions,
        saImpressions,
        impressions: dspImpressions + saImpressions,
        dspFormats,
        saFormats,
        pathType: classify(dspFormats, saFormats),
        raw: r,
      };
    });

  const totalSales = rows.reduce((s, r) => s + r.sales, 0);
  const totalPurch = rows.reduce((s, r) => s + r.purchases, 0);
  const totalNtbSales = rows.reduce((s, r) => s + r.ntbSales, 0);
  const totalNtbPurch = rows.reduce((s, r) => s + r.ntbPurchases, 0);

  const groups: PathTypeGroup[] = PATH_TYPE_ORDER.map(pathType => {
    const gr = rows.filter(r => r.pathType === pathType);
    const sales = gr.reduce((s, r) => s + r.sales, 0);
    const purchases = gr.reduce((s, r) => s + r.purchases, 0);
    const ntbSales = gr.reduce((s, r) => s + r.ntbSales, 0);
    const impWeighted = gr.reduce((s, r) => s + r.impressions * r.purchases, 0);
    return {
      pathType,
      paths: gr.length,
      sales,
      purchases,
      ntbSales,
      ntbPurchases: gr.reduce((s, r) => s + r.ntbPurchases, 0),
      avgImpressions: purchases > 0 ? impWeighted / purchases : 0,
      pctOfSales: totalSales > 0 ? (sales / totalSales) * 100 : 0,
      ntbSharePct: sales > 0 ? (ntbSales / sales) * 100 : 0,
      color: PATH_TYPE_COLORS[pathType],
    };
  }).filter(g => g.paths > 0);

  const grp = (t: PathType) => groups.find(g => g.pathType === t);
  const baseline = grp("Sponsored Ads");
  const assisted = grp("DSP + Sponsored Ads");
  const exclusive = grp("Amazon DSP only");
  const dspInvolved = (assisted?.sales ?? 0) + (exclusive?.sales ?? 0);
  const dsp: DspContribution = {
    baselineSales: baseline?.sales ?? 0,
    assistedSales: assisted?.sales ?? 0,
    exclusiveSales: exclusive?.sales ?? 0,
    dspInvolvedSales: dspInvolved,
    dspInvolvedPct: totalSales > 0 ? (dspInvolved / totalSales) * 100 : 0,
    exclusivePct: totalSales > 0 ? ((exclusive?.sales ?? 0) / totalSales) * 100 : 0,
    exclusivePurchases: exclusive?.purchases ?? 0,
    assistedPurchases: assisted?.purchases ?? 0,
    dspNtbPurchases: (assisted?.ntbPurchases ?? 0) + (exclusive?.ntbPurchases ?? 0),
    totalSales,
  };

  const first = records[0];
  return {
    rows,
    groups,
    dsp,
    totals: {
      paths: rows.length,
      sales: totalSales,
      purchases: totalPurch,
      ntbSales: totalNtbSales,
      ntbPurchases: totalNtbPurch,
      ntbSharePct: totalSales > 0 ? (totalNtbSales / totalSales) * 100 : 0,
    },
    period: {
      start: (pick(first, "Start Date") ?? "").trim(),
      end: (pick(first, "End Date") ?? "").trim(),
    },
    currency: (pick(first, "Currency") ?? "USD").trim() || "USD",
    hasUsefulData: totalSales > 0 && groups.length > 0,
    rawColumnNames: headers,
  };
}

function emptySummary(headers: string[]): ConvPathSummary {
  return {
    rows: [],
    groups: [],
    totals: { paths: 0, sales: 0, purchases: 0, ntbSales: 0, ntbPurchases: 0, ntbSharePct: 0 },
    dsp: {
      baselineSales: 0, assistedSales: 0, exclusiveSales: 0, dspInvolvedSales: 0,
      dspInvolvedPct: 0, exclusivePct: 0, exclusivePurchases: 0,
      assistedPurchases: 0, dspNtbPurchases: 0, totalSales: 0,
    },
    period: { start: "", end: "" },
    currency: "USD",
    hasUsefulData: false,
    rawColumnNames: headers,
  };
}
