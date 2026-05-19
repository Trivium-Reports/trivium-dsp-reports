/**
 * Chart Data Extraction Layer
 *
 * Extracts structured, chart-ready data from uploaded CSVs.
 * No fabrication — returns null/empty when data is unavailable.
 */

import { normalizeColumnName } from './csv-parser';
import type { ExecutiveSummaryMetrics } from './types';
import type { CampaignMapping } from '@/components/CampaignMappingTable';
import type { SectionAnalysis } from './analysis-engine';

/* ── Helpers ── */

function findCol(headers: string[], patterns: string[]): string | null {
  for (const h of headers) {
    const n = normalizeColumnName(h);
    for (const p of patterns) {
      if (n.includes(p)) return h;
    }
  }
  return null;
}

function num(val: string | undefined): number {
  return parseFloat(val?.replace(/[$,%]/g, '') || '0') || 0;
}

/* ═══════════════════════════════════════
   Executive Summary: Trend Data
   ═══════════════════════════════════════ */

export interface TrendPoint {
  date: string;
  dspSpend?: number;
  saSpend?: number;
  totalSpend: number;
  dspImpressions?: number;
  saImpressions?: number;
}

export function extractTrendData(
  dspData: Record<string, string>[] | null,
  dspHeaders: string[] | null,
  saData: Record<string, string>[] | null,
  saHeaders: string[] | null
): TrendPoint[] | null {
  const dspDateCol = dspHeaders ? findCol(dspHeaders, ['date', 'day', 'start_date', 'report_date']) : null;
  const saDateCol = saHeaders ? findCol(saHeaders, ['date', 'day', 'start_date', 'report_date']) : null;

  if (!dspDateCol && !saDateCol) return null;

  const dateMap = new Map<string, TrendPoint>();

  if (dspData && dspDateCol) {
    const spendCol = findCol(dspHeaders!, ['spend', 'cost']);
    const impCol = findCol(dspHeaders!, ['impression', 'impressions']);
    for (const row of dspData) {
      const d = row[dspDateCol];
      if (!d) continue;
      const existing = dateMap.get(d) || { date: d, totalSpend: 0 };
      existing.dspSpend = (existing.dspSpend || 0) + (spendCol ? num(row[spendCol]) : 0);
      existing.dspImpressions = (existing.dspImpressions || 0) + (impCol ? num(row[impCol]) : 0);
      existing.totalSpend = (existing.dspSpend || 0) + (existing.saSpend || 0);
      dateMap.set(d, existing);
    }
  }

  if (saData && saDateCol) {
    const spendCol = findCol(saHeaders!, ['spend', 'cost']);
    const impCol = findCol(saHeaders!, ['impression', 'impressions']);
    for (const row of saData) {
      const d = row[saDateCol];
      if (!d) continue;
      const existing = dateMap.get(d) || { date: d, totalSpend: 0 };
      existing.saSpend = (existing.saSpend || 0) + (spendCol ? num(row[spendCol]) : 0);
      existing.saImpressions = (existing.saImpressions || 0) + (impCol ? num(row[impCol]) : 0);
      existing.totalSpend = (existing.dspSpend || 0) + (existing.saSpend || 0);
      dateMap.set(d, existing);
    }
  }

  const points = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  return points.length >= 2 ? points : null;
}

/* ═══════════════════════════════════════
   Executive: Strategic Insight Cards
   ═══════════════════════════════════════ */

export interface StrategicInsightCard {
  title: string;
  value: string;
  description: string;
  sentiment: 'positive' | 'neutral' | 'warning';
}

export function extractStrategicInsights(
  metrics: ExecutiveSummaryMetrics,
  analyses: SectionAnalysis[]
): StrategicInsightCard[] {
  const cards: StrategicInsightCard[] = [];

  // Total ROAS insight
  const totalSpend = (metrics.dspSpend || 0) + (metrics.saSpend || 0);
  const totalSales = (metrics.saSales || 0);
  if (totalSpend > 0 && totalSales > 0) {
    const blendedROAS = totalSales / totalSpend;
    cards.push({
      title: 'Blended ROAS',
      value: `${blendedROAS.toFixed(2)}x`,
      description: blendedROAS >= 3 ? 'Strong return on combined spend. Protect the funnel and scale selectively where the data supports it.'
        : blendedROAS >= 1.5 ? 'Moderate return. Opportunity to improve mid-funnel capture and tighten frequency before scaling further.'
        : 'Below target. Review spend allocation, creative performance, and whether upper-funnel investment is being measured on the right metrics.',
      sentiment: blendedROAS >= 3 ? 'positive' : blendedROAS >= 1.5 ? 'neutral' : 'warning',
    });
  }

  // Exposure group reinforcement
  const expAnalysis = analyses.find(a => a.sectionId === 'exposure-group-analysis');
  if (expAnalysis?.available) {
    const hasReinforcement = expAnalysis.insights[0]?.observations.some(o =>
      o.includes('dual-channel reinforcement') || o.includes('full funnel reinforces')
    );
    if (hasReinforcement) {
      cards.push({
        title: 'Dual-Channel Lift',
        value: 'Confirmed',
        description: 'Users exposed to both DSP and Sponsored Ads convert at materially higher rates. This is reinforcement, not overlap.',
        sentiment: 'positive',
      });
    }
  }

  // Frequency saturation
  const freqAnalysis = analyses.find(a => a.sectionId === 'frequency-analysis');
  if (freqAnalysis?.available) {
    const hasWaste = freqAnalysis.insights[0]?.observations.some(o => o.includes('waste'));
    const hasSaturation = freqAnalysis.insights[0]?.observations.some(o => o.includes('saturation'));
    if (hasWaste) {
      cards.push({
        title: 'Frequency Waste',
        value: 'Detected',
        description: 'Impressions in upper frequency bands are not driving incremental conversions. Budget is at risk of being spent on already-saturated users.',
        sentiment: 'warning',
      });
    } else if (hasSaturation) {
      cards.push({
        title: 'Saturation Signal',
        value: 'Emerging',
        description: 'Performance is flattening at higher frequencies. A cap opportunity exists — act before waste accumulates.',
        sentiment: 'neutral',
      });
    }
  }

  // Net-new reach health
  const reachAnalysis = analyses.find(a => a.sectionId === 'reach-analysis');
  if (reachAnalysis?.available) {
    const weakCapture = reachAnalysis.insights[0]?.observations.some(o => o.includes('downstream') || o.includes('weak'));
    cards.push({
      title: 'Prospecting Health',
      value: weakCapture ? 'Needs MOF' : 'On Track',
      description: weakCapture
        ? 'Reach is expanding, but newly found users are not converting. The gap is in mid-funnel capture, not prospecting volume.'
        : 'Net-new reach is converting at healthy rates. TOF investment is earning its place.',
      sentiment: weakCapture ? 'warning' : 'positive',
    });
  }

  // Converter path depth
  const convAnalysis = analyses.find(a => a.sectionId === 'converters-analysis');
  if (convAnalysis?.available && cards.length < 3) {
    cards.push({
      title: 'Path Depth',
      value: 'Multi-Touch',
      description: 'Converters engage across more touchpoints before buying — supports full-funnel investment.',
      sentiment: 'positive',
    });
  }

  return cards.slice(0, 3);
}

/* ═══════════════════════════════════════
   Exposure Group Chart Data
   ═══════════════════════════════════════ */

export interface ExposureGroupChartData {
  name: string;
  users: number;
  purchasers: number;
  convRate: number;
  dpvsPerUser?: number;
  brandedSearchPerUser?: number;
  sales?: number;
  /** lift vs sponsored-only group (percentage points) */
  liftVsSponsoredOnly?: number;
  /** lift vs DSP-only group (percentage points) */
  liftVsDspOnly?: number;
}

export function extractExposureChartData(
  data: Record<string, string>[] | null,
  headers: string[] | null
): ExposureGroupChartData[] | null {
  if (!data || !headers) return null;

  const groupCol = findCol(headers, ['exposure_group', 'group', 'segment', 'channel_group']);
  const usersCol = findCol(headers, ['users_exposed', 'users', 'reach', 'exposed_users']);
  const purchCol = findCol(headers, ['purchasers', 'converters', 'buyers']);
  if (!groupCol || !usersCol || !purchCol) return null;

  const dpvCol = findCol(headers, ['dpvs_per_user', 'dpv_per_user']);
  const searchCol = findCol(headers, ['branded_searches_per_user']);
  const salesCol = findCol(headers, ['sales', 'revenue']);

  const rawResult = data.map(r => {
    const users = num(r[usersCol]);
    const purchasers = num(r[purchCol]);
    return {
      name: r[groupCol],
      users,
      purchasers,
      convRate: users > 0 ? (purchasers / users) * 100 : 0,
      dpvsPerUser: dpvCol ? num(r[dpvCol]) : undefined,
      brandedSearchPerUser: searchCol ? num(r[searchCol]) : undefined,
      sales: salesCol ? num(r[salesCol]) : undefined,
    };
  }).filter(g => g.users > 0);

  if (rawResult.length === 0) return null;

  // Find sponsored-only and DSP-only baselines for lift calculations
  const findBaseline = (patterns: string[], exclude?: string[]) =>
    rawResult.find(g => {
      const n = g.name.toLowerCase();
      return patterns.some(p => n.includes(p)) && !(exclude || []).some(e => n.includes(e));
    });

  const sponsoredOnlyRate = (findBaseline(['sponsored only', 'sa only']) ||
    rawResult.find(g => {
      const n = g.name.toLowerCase();
      return n.includes('sponsored') && !n.includes('dsp') && !n.includes('+');
    }))?.convRate;

  const dspOnlyRate = (findBaseline(['dsp only']) ||
    rawResult.find(g => {
      const n = g.name.toLowerCase();
      return n.includes('dsp') && !n.includes('sponsored') && !n.includes('+');
    }))?.convRate;

  const result = rawResult.map(g => ({
    ...g,
    liftVsSponsoredOnly: sponsoredOnlyRate !== undefined && sponsoredOnlyRate > 0
      ? ((g.convRate - sponsoredOnlyRate) / sponsoredOnlyRate) * 100
      : undefined,
    liftVsDspOnly: dspOnlyRate !== undefined && dspOnlyRate > 0
      ? ((g.convRate - dspOnlyRate) / dspOnlyRate) * 100
      : undefined,
  }));

  return result;
}

/* ═══════════════════════════════════════
   Funnel Stage Data
   ═══════════════════════════════════════ */

export interface FunnelStageData {
  stage: string;
  role: string;
  spend: number;
  sales: number;
  roas: number;
  impressions: number;
}

export function extractFunnelData(
  dspData: Record<string, string>[] | null,
  dspHeaders: string[] | null,
  saData: Record<string, string>[] | null,
  saHeaders: string[] | null,
  mappings: CampaignMapping[]
): FunnelStageData[] | null {
  if (mappings.length === 0) return null;

  const stageRoles: Record<string, string> = {
    TOF: 'Build',
    MOF: 'Capture',
    BOF: 'Convert',
    Sponsored: 'Harvest',
  };

  const stageAgg: Record<string, { spend: number; sales: number; impressions: number }> = {};

  const matchStage = (campaignName: string): string | null => {
    const m = mappings.find(cm =>
      campaignName.toLowerCase().includes(cm.campaignName.toLowerCase()) ||
      cm.campaignName.toLowerCase().includes(campaignName.toLowerCase())
    );
    return m?.label || null;
  };

  const processData = (data: Record<string, string>[] | null, headers: string[] | null) => {
    if (!data || !headers) return;
    const nameCol = findCol(headers, ['campaign_name', 'campaign', 'name']);
    const spendCol = findCol(headers, ['spend', 'cost']);
    const salesCol = findCol(headers, ['sales', 'revenue', 'total_sales']);
    const impCol = findCol(headers, ['impression', 'impressions']);
    if (!nameCol) return;

    for (const row of data) {
      const stage = matchStage(row[nameCol] || '');
      if (!stage) continue;
      if (!stageAgg[stage]) stageAgg[stage] = { spend: 0, sales: 0, impressions: 0 };
      stageAgg[stage].spend += spendCol ? num(row[spendCol]) : 0;
      stageAgg[stage].sales += salesCol ? num(row[salesCol]) : 0;
      stageAgg[stage].impressions += impCol ? num(row[impCol]) : 0;
    }
  };

  processData(dspData, dspHeaders);
  processData(saData, saHeaders);

  const order = ['TOF', 'MOF', 'BOF', 'Sponsored'];
  const result = order
    .filter(s => stageAgg[s] && stageAgg[s].spend > 0)
    .map(s => ({
      stage: s,
      role: stageRoles[s] || s,
      spend: stageAgg[s].spend,
      sales: stageAgg[s].sales,
      roas: stageAgg[s].spend > 0 ? stageAgg[s].sales / stageAgg[s].spend : 0,
      impressions: stageAgg[s].impressions,
    }));

  return result.length > 0 ? result : null;
}

/* ═══════════════════════════════════════
   Converter Comparison Data
   ═══════════════════════════════════════ */

export interface ConverterMetric {
  label: string;
  shortLabel: string;
  converterVal: number;
  nonConverterVal: number;
  /** converter / nonConverter ratio (e.g. 2.3x) */
  ratio: number;
  /** percentage delta */
  index: number;
}

export function extractConverterComparison(
  data: Record<string, string>[] | null,
  headers: string[] | null
): ConverterMetric[] | null {
  if (!data || !headers || data.length === 0) return null;

  const keyMetricCol = findCol(headers, ['key_metric', 'metric', 'kpi']);
  const customerTypeCol = findCol(headers, ['customer_type', 'segment', 'purchase', 'converter', 'purchase_flag']);
  const statsCol = findCol(headers, ['stats', 'value', 'stat', 'metric_value']);

  const isLongFormat = !!keyMetricCol && !!customerTypeCol && !!statsCol;
  if (!customerTypeCol && !keyMetricCol) return null;

  const metricDefs = [
    { patterns: ['ad_products_exposed_per_user', 'ad_products_exposed'], label: 'Ad Products Exposed / User', shortLabel: 'Ad Products' },
    { patterns: ['total_impressions_per_user', 'impressions_per_user'], label: 'Total Impressions / User', shortLabel: 'Impressions' },
    { patterns: ['dpvs_per_user', 'detail_page_views_per_user'], label: 'DPVs / User', shortLabel: 'DPVs' },
    { patterns: ['products_viewed_per_user', 'products_viewed'], label: 'Products Viewed / User', shortLabel: 'Products Viewed' },
    { patterns: ['days_to_purchase_per_user', 'days_to_purchase'], label: 'Days to Purchase', shortLabel: 'Days' },
  ];

  const comparisons: ConverterMetric[] = [];

  if (isLongFormat) {
    for (const m of metricDefs) {
      const matchingRows = data.filter(r => {
        const km = normalizeColumnName(r[keyMetricCol!] || '');
        return m.patterns.some(p => km.includes(p));
      });
      if (matchingRows.length === 0) continue;

      const purchRows = matchingRows.filter(r => {
        const v = (r[customerTypeCol!] || '').toLowerCase();
        return v.includes('purchase') && !v.includes('no') && !v.includes('non');
      });
      const noPurchRows = matchingRows.filter(r => {
        const v = (r[customerTypeCol!] || '').toLowerCase();
        return v.includes('no') || v.includes('non');
      });
      if (purchRows.length === 0 || noPurchRows.length === 0) continue;

      const cVal = purchRows.reduce((a, r) => a + num(r[statsCol!]), 0) / purchRows.length;
      const ncVal = noPurchRows.reduce((a, r) => a + num(r[statsCol!]), 0) / noPurchRows.length;
      comparisons.push({
        label: m.label,
        shortLabel: m.shortLabel,
        converterVal: cVal,
        nonConverterVal: ncVal,
        ratio: ncVal > 0 ? cVal / ncVal : 0,
        index: ncVal > 0 ? cVal / ncVal : 0,
      });
    }
  } else {
    const segCol = customerTypeCol!;
    const purchaseRows = data.filter(r => {
      const v = (r[segCol] || '').toLowerCase();
      return (v.includes('purchase') || v.includes('converter')) && !v.includes('no') && !v.includes('non');
    });
    const noPurchaseRows = data.filter(r => {
      const v = (r[segCol] || '').toLowerCase();
      return v.includes('no') || v.includes('non');
    });
    if (purchaseRows.length === 0 || noPurchaseRows.length === 0) return null;

    for (const m of metricDefs) {
      const col = findCol(headers, m.patterns);
      if (!col) continue;
      const cVal = purchaseRows.reduce((a, r) => a + num(r[col]), 0) / purchaseRows.length;
      const ncVal = noPurchaseRows.reduce((a, r) => a + num(r[col]), 0) / noPurchaseRows.length;
      comparisons.push({
        label: m.label,
        shortLabel: m.shortLabel,
        converterVal: cVal,
        nonConverterVal: ncVal,
        ratio: ncVal > 0 ? cVal / ncVal : 0,
        index: ncVal > 0 ? cVal / ncVal : 0,
      });
    }
  }

  return comparisons.length > 0 ? comparisons : null;
}

/* ═══════════════════════════════════════
   Frequency Band Data
   ═══════════════════════════════════════ */

export type FrequencyZone = 'building' | 'efficient' | 'diminishing';

export interface FrequencyBandData {
  bucket: string;
  bucketNum: number;
  purchaseRate: number;
  reach: number;
  impressions: number;
  zone: FrequencyZone;
  /** reach / total_reach across all buckets */
  percentReach: number;
  /** impressions / total_impressions across all buckets */
  percentImpressions: number;
}

export function extractFrequencyBands(
  data: Record<string, string>[] | null,
  headers: string[] | null
): FrequencyBandData[] | null {
  if (!data || !headers || data.length < 3) return null;

  const freqCol = findCol(headers, ['frequency_bucket', 'frequency', 'freq']);
  if (!freqCol) return null;

  const purchRateCol = findCol(headers, ['purchase_rate', 'conversion_rate']);
  const reachCol = findCol(headers, ['reach', 'users']);
  const impCol = findCol(headers, ['impressions', 'impression']);
  const purchasesCol = findCol(headers, ['purchases', 'purchasers', 'buyers']);
  const ctrCol = findCol(headers, ['ctr', 'click_through_rate']);
  const dpvCol = findCol(headers, ['detail_page_view_rate', 'detail_page_views', 'dpvr']);
  const searchCol = findCol(headers, ['branded_search_rate', 'branded_searches', 'branded_search']);

  const hasPurchaseRate = !!purchRateCol;
  const canDeriveRate = !!purchasesCol && !!reachCol;
  // Engagement-only fallback: use best available engagement metric as the "rate"
  const engagementCol = !hasPurchaseRate && !canDeriveRate ? (dpvCol || ctrCol || searchCol) : null;

  // Must have at least one metric to chart
  if (!hasPurchaseRate && !canDeriveRate && !engagementCol) return null;

  const rawRows = [...data]
    .map(r => {
      const reach = reachCol ? num(r[reachCol]) : 0;
      const purchases = purchasesCol ? num(r[purchasesCol]) : 0;
      let purchaseRate: number;
      if (hasPurchaseRate) {
        purchaseRate = num(r[purchRateCol]);
      } else if (canDeriveRate) {
        purchaseRate = reach > 0 ? (purchases / reach) * 100 : 0;
      } else if (engagementCol) {
        purchaseRate = num(r[engagementCol]); // use engagement metric as proxy
      } else {
        purchaseRate = 0;
      }
      return {
        bucket: r[freqCol],
        bucketNum: parseInt(r[freqCol]?.replace(/[^0-9]/g, '') || '0'),
        purchaseRate,
        reach,
        impressions: impCol ? num(r[impCol]) : 0,
        zone: 'building' as FrequencyZone,
        percentReach: 0,
        percentImpressions: 0,
      };
    })
    .sort((a, b) => a.bucketNum - b.bucketNum);

  if (rawRows.length < 3) return null;

  // Compute totals for percent calculations
  const totalReach = rawRows.reduce((a, r) => a + r.reach, 0);
  const totalImpressions = rawRows.reduce((a, r) => a + r.impressions, 0);

  const sorted = rawRows.map(r => ({
    ...r,
    percentReach: totalReach > 0 ? (r.reach / totalReach) * 100 : 0,
    percentImpressions: totalImpressions > 0 ? (r.impressions / totalImpressions) * 100 : 0,
  }));

  // Find peak
  let peakIdx = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].purchaseRate > sorted[peakIdx].purchaseRate) peakIdx = i;
  }

  // Assign zones
  const peakRate = sorted[peakIdx].purchaseRate;
  for (let i = 0; i < sorted.length; i++) {
    if (i < peakIdx) {
      // Building if rate is climbing, efficient once we're near peak
      const rateRatio = peakRate > 0 ? sorted[i].purchaseRate / peakRate : 0;
      sorted[i].zone = rateRatio >= 0.8 ? 'efficient' : 'building';
    } else if (i === peakIdx) {
      sorted[i].zone = 'efficient';
    } else {
      // After peak: diminishing
      sorted[i].zone = 'diminishing';
    }
  }

  return sorted;
}

/* ═══════════════════════════════════════
   Net-New Reach Table Data
   ═══════════════════════════════════════ */

export interface NetNewReachRow {
  group: string;
  reach: number;
  impressions: number;
  clicks: number;
  purchasers: number;
  sales: number;
  netNewShare: number;
  /** net_new_reach / total_impressions */
  reachEfficiency: number;
  /** net_new_clicks / net_new_impressions */
  netNewClickRate: number;
  /** net_new_purchasers / net_new_reach */
  netNewConversionRate: number;
  /** net_new_impressions / total_impressions */
  percentNetNewImpressions: number;
  /** total_impressions / total_reach */
  averageFrequency: number;
}

export function extractNetNewReachData(
  data: Record<string, string>[] | null,
  headers: string[] | null
): NetNewReachRow[] | null {
  if (!data || !headers || data.length === 0) return null;

  const groupCol = findCol(headers, ['campaign_group', 'campaign', 'group']);
  const nnReachCol = findCol(headers, ['net_new_reach', 'new_reach']);
  const nnImpCol = findCol(headers, ['net_new_impressions']);
  const nnClickCol = findCol(headers, ['net_new_clicks']);
  const nnPurchCol = findCol(headers, ['net_new_users_who_purchased', 'net_new_purchasers']);
  const nnSalesCol = findCol(headers, ['net_new_sales']);
  const totalReachCol = findCol(headers, ['total_reach', 'total_users']);
  const totalImpCol = findCol(headers, ['total_impressions']);

  if (!nnReachCol) return null;

  const groups = groupCol ? [...new Set(data.map(r => r[groupCol]))] : ['All'];

  const rows: NetNewReachRow[] = groups.map(group => {
    const groupRows = groupCol ? data.filter(r => r[groupCol] === group) : data;
    const reach = groupRows.reduce((a, r) => a + num(r[nnReachCol]), 0);
    const totalReach = totalReachCol ? groupRows.reduce((a, r) => a + num(r[totalReachCol]), 0) : 0;
    const nnImpressions = nnImpCol ? groupRows.reduce((a, r) => a + num(r[nnImpCol]), 0) : 0;
    const nnClicks = nnClickCol ? groupRows.reduce((a, r) => a + num(r[nnClickCol]), 0) : 0;
    const nnPurchasers = nnPurchCol ? groupRows.reduce((a, r) => a + num(r[nnPurchCol]), 0) : 0;
    const nnSales = nnSalesCol ? groupRows.reduce((a, r) => a + num(r[nnSalesCol]), 0) : 0;
    const totalImpressions = totalImpCol ? groupRows.reduce((a, r) => a + num(r[totalImpCol]), 0) : 0;
    return {
      group,
      reach,
      impressions: nnImpressions,
      clicks: nnClicks,
      purchasers: nnPurchasers,
      sales: nnSales,
      netNewShare: totalReach > 0 ? (reach / totalReach) * 100 : 0,
      reachEfficiency: totalImpressions > 0 ? reach / totalImpressions : 0,
      netNewClickRate: nnImpressions > 0 ? (nnClicks / nnImpressions) * 100 : 0,
      netNewConversionRate: reach > 0 ? (nnPurchasers / reach) * 100 : 0,
      percentNetNewImpressions: totalImpressions > 0 ? (nnImpressions / totalImpressions) * 100 : 0,
      averageFrequency: totalReach > 0 ? totalImpressions / totalReach : 0,
    };
  }).filter(r => r.reach > 0);

  return rows.length > 0 ? rows : null;
}
