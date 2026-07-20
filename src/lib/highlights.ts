import type { DSPSummary } from "./dsp-data";

/**
 * Auto-generated strategic bullets — same W2-vs-W1 analysis the Slack
 * briefing runs, rendered as an in-browser page for internal use as
 * baseline for the strategist's own write-up.
 *
 * Not sent to clients directly (per 2026-06-11 direction from Trish).
 */

export interface HighlightBullet {
  takeaway: string;   // bold one-liner
  body: string;       // supporting numbers with W2/W1 and delta
  implication: string; // strategic "so what"
}

export interface Highlights {
  brand: string;
  periodStart: string;
  periodEnd: string;
  w1Range: string;
  w2Range: string;
  bullets: HighlightBullet[];
}

/* ── Formatters ── */
const fmtUsd = (n: number) =>
  n >= 1000
    ? `$${(n / 1000).toFixed(1)}K`
    : `$${n.toFixed(2)}`;

const fmtCount = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
    ? `${(n / 1000).toFixed(1)}K`
    : `${Math.round(n)}`;

const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtRoas = (n: number) => `${n.toFixed(2)}x`;

const pctDelta = (curr: number, prev: number): number =>
  prev > 0 ? ((curr - prev) / prev) * 100 : 0;

const dirWord = (delta: number, positiveIsGood = true): string => {
  const good = positiveIsGood ? delta > 0 : delta < 0;
  if (Math.abs(delta) < 1) return "held roughly flat";
  return good ? "strengthened" : "slid";
};

/* ── Aggregation of a week's worth of rows ── */
interface WeekAgg {
  spend: number;
  impressions: number;
  ctr: number;
  purchases: number;
  ntbPurchases: number;
  ntbPercent: number;
  sales: number;
  ntbSales: number;
  roas: number;
  cpa: number;
  daysCovered: number;
  startDate: string;
  endDate: string;
}

function aggWeek(rows: DSPSummary["rows"]): WeekAgg | null {
  if (rows.length === 0) return null;
  const spend = rows.reduce((s, r) => s + r.spend, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const clicksAsRateOfImpressions =
    rows.reduce((s, r) => s + (r.ctr / 100) * r.impressions, 0);
  const ctr = impressions > 0 ? (clicksAsRateOfImpressions / impressions) * 100 : 0;
  const purchases = rows.reduce((s, r) => s + r.purchases, 0);
  const ntbPurchases = rows.reduce((s, r) => s + r.ntbPurchases, 0);
  const sales = rows.reduce((s, r) => s + r.sales, 0);
  const ntbSales = rows.reduce((s, r) => s + r.ntbSales, 0);
  const ntbPercent = purchases > 0 ? (ntbPurchases / purchases) * 100 : 0;
  const roas = spend > 0 ? sales / spend : 0;
  const cpa = purchases > 0 ? spend / purchases : 0;
  return {
    spend, impressions, ctr,
    purchases, ntbPurchases, ntbPercent,
    sales, ntbSales, roas, cpa,
    daysCovered: rows.length,
    startDate: rows[0].date,
    endDate: rows[rows.length - 1].date,
  };
}

/* ── Bullet generation ── */

export function generateHighlights(summary: DSPSummary): Highlights {
  const rows = [...summary.rows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Split into W1 (older half) and W2 (newer half). Handles <14 days gracefully.
  const half = Math.floor(rows.length / 2);
  const w1Rows = rows.slice(0, half);
  const w2Rows = rows.slice(half);
  const w1 = aggWeek(w1Rows);
  const w2 = aggWeek(w2Rows);

  const bullets: HighlightBullet[] = [];

  if (w1 && w2 && w1.spend > 0 && w2.spend > 0) {
    // ── Bullet 1: ROAS movement ──
    const roasDelta = pctDelta(w2.roas, w1.roas);
    bullets.push({
      takeaway: `ROAS ${dirWord(roasDelta, true)} — ${fmtRoas(w2.roas)} in Week 2 vs. ${fmtRoas(w1.roas)} in Week 1 (${roasDelta >= 0 ? "+" : ""}${roasDelta.toFixed(0)}%).`,
      body: `Sales moved from ${fmtUsd(w1.sales)} to ${fmtUsd(w2.sales)} (${pctDelta(w2.sales, w1.sales) >= 0 ? "+" : ""}${pctDelta(w2.sales, w1.sales).toFixed(1)}%) on spend of ${fmtUsd(w2.spend)} vs. ${fmtUsd(w1.spend)} (${pctDelta(w2.spend, w1.spend) >= 0 ? "+" : ""}${pctDelta(w2.spend, w1.spend).toFixed(1)}%).`,
      implication:
        roasDelta > 5
          ? "Efficiency gain — consider extending the winning tactic before pushing more spend."
          : roasDelta < -5
          ? "Efficiency erosion — investigate which campaigns absorbed the extra spend before scaling further."
          : "Efficiency held steady — safe to scale or hold based on other signals.",
    });

    // ── Bullet 2: NTB acquisition ──
    const ntbDelta = pctDelta(w2.ntbPurchases, w1.ntbPurchases);
    const ntbPctDelta = w2.ntbPercent - w1.ntbPercent; // percentage-point
    bullets.push({
      takeaway: `NTB acquisition ${ntbDelta > 0 ? "surged" : ntbDelta < 0 ? "softened" : "held flat"} — ${fmtCount(w2.ntbPurchases)} net-new buyers in Week 2 vs. ${fmtCount(w1.ntbPurchases)} in Week 1 (${ntbDelta >= 0 ? "+" : ""}${ntbDelta.toFixed(1)}%).`,
      body: `NTB share of purchases moved ${w1.ntbPercent.toFixed(1)}% → ${w2.ntbPercent.toFixed(1)}% (${ntbPctDelta >= 0 ? "+" : ""}${ntbPctDelta.toFixed(1)}%). NTB sales: ${fmtUsd(w2.ntbSales)} in Week 2 vs. ${fmtUsd(w1.ntbSales)} in Week 1.`,
      implication:
        w2.ntbPercent >= 40
          ? "DSP is functioning strongly as a prospecting engine — worth funding new-customer creative next cycle."
          : w2.ntbPercent >= 20
          ? "Prospecting share is healthy but not dominant — mix of NTB and returning-buyer purchases."
          : "Skewing toward retargeting-heavy purchases — consider whether prospecting audience needs a refresh.",
    });

    // ── Bullet 3: Engagement (CTR + impressions) ──
    const ctrDelta = w2.ctr - w1.ctr;
    const impDelta = pctDelta(w2.impressions, w1.impressions);
    bullets.push({
      takeaway: `Engagement quality ${ctrDelta > 0.02 ? "improved" : ctrDelta < -0.02 ? "weakened" : "held steady"} — CTR ${w1.ctr.toFixed(2)}% → ${w2.ctr.toFixed(2)}% (${ctrDelta >= 0 ? "+" : ""}${ctrDelta.toFixed(2)}%).`,
      body: `Impressions ${impDelta >= 0 ? "up" : "down"} ${Math.abs(impDelta).toFixed(1)}% (${fmtCount(w1.impressions)} → ${fmtCount(w2.impressions)}).`,
      implication:
        ctrDelta > 0.05
          ? "Sharper engagement on similar-or-higher reach — creative and audience are landing."
          : ctrDelta < -0.05
          ? "Audience broadening or creative fatigue eating into CTR — worth a swap-test."
          : "Auction quality steady across the window.",
    });

    // ── Bullet 4: CPA / efficiency check ──
    const cpaDelta = pctDelta(w2.cpa, w1.cpa);
    bullets.push({
      takeaway: `Cost per purchase ${cpaDelta > 5 ? "climbed" : cpaDelta < -5 ? "improved" : "held steady"} — ${fmtUsd(w1.cpa)} → ${fmtUsd(w2.cpa)} (${cpaDelta >= 0 ? "+" : ""}${cpaDelta.toFixed(1)}%).`,
      body: `Purchases: ${fmtCount(w1.purchases)} → ${fmtCount(w2.purchases)} (${pctDelta(w2.purchases, w1.purchases) >= 0 ? "+" : ""}${pctDelta(w2.purchases, w1.purchases).toFixed(1)}%).`,
      implication:
        cpaDelta > 15
          ? "CAC pressure — recommend tightening back to the higher-converting audience segments from Week 1 before scaling."
          : cpaDelta < -15
          ? "CAC improvement — cohorts appear to be responding better; safe test window to push spend."
          : "CAC broadly stable at the current spend level.",
    });
  } else {
    bullets.push({
      takeaway: "Insufficient two-week comparison window.",
      body: `Only ${rows.length} days of data available in the current CSV.`,
      implication: "Bullets will populate once at least 14 days of data are ingested.",
    });
  }

  return {
    brand: summary.brand,
    periodStart: summary.dateRange.start,
    periodEnd: summary.dateRange.end,
    w1Range: w1 ? `${w1.startDate} – ${w1.endDate}` : "n/a",
    w2Range: w2 ? `${w2.startDate} – ${w2.endDate}` : "n/a",
    bullets,
  };
}
