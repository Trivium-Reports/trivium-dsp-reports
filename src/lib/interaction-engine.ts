import { normalizeColumnName } from './csv-parser';
import { thresholdLabel, THRESHOLDS, getMetric, matchFunnelStage } from './metrics-glossary';

/* ── Types ── */

export interface InteractionInsight {
  headline: string;
  observations: string[];
  soWhat: string;
  recommendation: string;
}

export interface InteractionAnalysis {
  available: boolean;
  unavailableReason?: string;
  insights: InteractionInsight[];
}

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

function findColFromMetric(headers: string[], metricId: string): string | null {
  const metric = getMetric(metricId);
  if (!metric) return null;
  return findCol(headers, metric.columnPatterns);
}

function num(val: string | undefined): number {
  return parseFloat(val?.replace(/[$,%]/g, '') || '0') || 0;
}

function pctDiff(a: number, b: number): number {
  if (b === 0) return 0;
  return ((a - b) / b) * 100;
}

/* ── Part 1: verify dual-channel activity ── */

function verifyDualChannel(
  dspData: Record<string, string>[],
  dspHeaders: string[],
  saData: Record<string, string>[],
  saHeaders: string[]
): { active: boolean; reason?: string } {
  const dspSpendCol = findCol(dspHeaders, ['spend', 'cost']);
  const dspImpCol = findCol(dspHeaders, ['impression', 'impressions']);
  const saSpendCol = findCol(saHeaders, ['spend', 'cost']);
  const saImpCol = findCol(saHeaders, ['impression', 'impressions']);

  const dspActive =
    (dspSpendCol && dspData.some(r => num(r[dspSpendCol]) > 0)) ||
    (dspImpCol && dspData.some(r => num(r[dspImpCol]) > 0));
  const saActive =
    (saSpendCol && saData.some(r => num(r[saSpendCol]) > 0)) ||
    (saImpCol && saData.some(r => num(r[saImpCol]) > 0));

  if (!dspActive && !saActive) return { active: false, reason: 'Neither DSP nor Sponsored Ads show activity in this reporting window.' };
  if (!dspActive) return { active: false, reason: 'DSP shows no spend or impressions in this reporting window. Dual-channel interaction cannot be evaluated.' };
  if (!saActive) return { active: false, reason: 'Sponsored Ads shows no spend or impressions in this reporting window. Dual-channel interaction cannot be evaluated.' };
  return { active: true };
}

/* ── Part 2: Purchase path reinforcement ── */

function analyzePurchasePath(
  data: Record<string, string>[],
  headers: string[]
): InteractionInsight | null {
  // Identify purchase vs no-purchase rows
  const segCol = findCol(headers, ['purchase', 'converter', 'segment', 'group', 'purchase_flag']);
  if (!segCol) return null;

  const purchaseRows = data.filter(r => {
    const v = r[segCol]?.toLowerCase() || '';
    return v.includes('purchase') || v.includes('converter') || v === 'yes' || v === '1' || v === 'true';
  });
  const noPurchaseRows = data.filter(r => {
    const v = r[segCol]?.toLowerCase() || '';
    return v.includes('no_purchase') || v.includes('non_converter') || v.includes('no purchase') || v === 'no' || v === '0' || v === 'false';
  });

  if (purchaseRows.length === 0 || noPurchaseRows.length === 0) return null;

  const metrics = [
    { patterns: ['ad_products_exposed_per_user', 'ad_products_exposed', 'ad_product'], label: 'ad products exposed per user' },
    { patterns: ['total_impressions_per_user', 'impressions_per_user', 'avg_impressions'], label: 'total impressions per user' },
    { patterns: ['dpvs_per_user', 'detail_page_views_per_user', 'dpv_per_user'], label: 'detail page views per user' },
    { patterns: ['products_viewed_per_user', 'products_viewed'], label: 'products viewed per user' },
    { patterns: ['days_to_purchase_per_user', 'days_to_purchase', 'avg_days_to_purchase'], label: 'days to purchase' },
  ];

  const observations: string[] = [];

  for (const m of metrics) {
    const col = findCol(headers, m.patterns);
    if (!col) continue;
    const purchAvg = purchaseRows.reduce((a, r) => a + num(r[col]), 0) / purchaseRows.length;
    const noAvg = noPurchaseRows.reduce((a, r) => a + num(r[col]), 0) / noPurchaseRows.length;
    const diff = pctDiff(purchAvg, noAvg);

    if (m.label === 'days to purchase' && purchAvg > noAvg) {
      observations.push(
        `Converters take ${thresholdLabel(diff)} time to purchase (${purchAvg.toFixed(1)} days vs ${noAvg.toFixed(1)} days), suggesting DSP may be assisting discovery and consideration before Sponsored Ads captures demand.`
      );
    } else if (diff >= 15) {
      observations.push(
        `Converters show ${thresholdLabel(diff)} ${m.label} (${purchAvg.toFixed(1)} vs ${noAvg.toFixed(1)}), indicating broader cross-touchpoint exposure is associated with stronger conversion readiness.`
      );
    }
  }

  if (observations.length === 0) return null;

  return {
    headline: 'Multi-touch exposure is associated with stronger conversion readiness.',
    observations,
    soWhat: 'Converters appear to engage across more ad touchpoints before purchase. This supports a dual-channel strategy where DSP drives awareness and Sponsored Ads captures demand.',
    recommendation: 'Maintain DSP upper-funnel investment to build consideration depth. Monitor purchase path metrics bi-weekly to confirm the reinforcement pattern holds.',
  };
}

/* ── Part 3: Frequency reinforcement vs saturation ── */

function analyzeFrequency(
  data: Record<string, string>[],
  headers: string[]
): InteractionInsight | null {
  const freqCol = findCol(headers, ['frequency_bucket', 'frequency', 'freq']);
  if (!freqCol) return null;

  const purchCol = findCol(headers, ['purchase_rate', 'purchases', 'purchase', 'conversion_rate']);
  const dpvCol = findCol(headers, ['detail_page_view_rate', 'detail_page_views', 'dpvr']);
  const searchCol = findCol(headers, ['branded_search_rate', 'branded_searches', 'branded_search']);
  const reachCol = findCol(headers, ['reach']);

  if (!purchCol && !dpvCol) return null;

  // Sort rows by frequency bucket numerically
  const sorted = [...data].sort((a, b) => {
    const aNum = parseInt(a[freqCol]?.replace(/[^0-9]/g, '') || '0');
    const bNum = parseInt(b[freqCol]?.replace(/[^0-9]/g, '') || '0');
    return aNum - bNum;
  });

  if (sorted.length < 3) return null;

  const observations: string[] = [];
  let saturationBucket: string | null = null;

  // Detect improvement then plateau/decline
  if (purchCol) {
    const rates = sorted.map(r => ({ bucket: r[freqCol], rate: num(r[purchCol]) }));
    let peakIdx = 0;
    for (let i = 1; i < rates.length; i++) {
      if (rates[i].rate > rates[peakIdx].rate) peakIdx = i;
    }
    if (peakIdx > 0 && peakIdx < rates.length - 1) {
      observations.push(
        `Purchase engagement improves through the ${rates[peakIdx].bucket} frequency band, indicating repeated exposure builds conversion readiness.`
      );
      saturationBucket = rates[peakIdx + 1]?.bucket || null;
    } else if (peakIdx > 0) {
      observations.push(
        `Downstream conversion metrics strengthen as frequency increases through ${rates[peakIdx].bucket}, suggesting cross-channel reinforcement up to the efficient band.`
      );
    }
    if (saturationBucket) {
      observations.push(
        `Beyond the ${saturationBucket} bucket, additional impressions appear to add less incremental value — a signal of saturation.`
      );
    }
  }

  if (dpvCol) {
    const midIdx = Math.floor(sorted.length / 2);
    const earlyAvg = sorted.slice(0, midIdx).reduce((a, r) => a + num(r[dpvCol]), 0) / midIdx;
    const lateAvg = sorted.slice(midIdx).reduce((a, r) => a + num(r[dpvCol]), 0) / (sorted.length - midIdx);
    if (pctDiff(lateAvg, earlyAvg) >= 15) {
      observations.push(
        `Detail page view engagement is ${thresholdLabel(pctDiff(lateAvg, earlyAvg))} in higher frequency bands, supporting continued exposure within the efficient range.`
      );
    }
  }

  if (searchCol) {
    const midIdx = Math.floor(sorted.length / 2);
    const earlyAvg = sorted.slice(0, midIdx).reduce((a, r) => a + num(r[searchCol]), 0) / midIdx;
    const lateAvg = sorted.slice(midIdx).reduce((a, r) => a + num(r[searchCol]), 0) / (sorted.length - midIdx);
    if (pctDiff(lateAvg, earlyAvg) >= 15) {
      observations.push(
        `Branded search activity increases with exposure depth, indicating DSP is likely driving brand awareness that Sponsored Ads can capture.`
      );
    }
  }

  if (observations.length === 0) return null;

  return {
    headline: 'Repeated exposure improves downstream engagement up to the efficient frequency band.',
    observations,
    soWhat: saturationBucket
      ? `Once users move beyond the efficient band (around ${saturationBucket}), additional impressions appear to add less incremental value. Budget should be reallocated to reach new audiences rather than deepening frequency on saturated ones.`
      : 'The frequency data shows a pattern of reinforcement where repeated cross-channel exposure strengthens downstream actions. Monitoring the saturation point bi-weekly is recommended.',
    recommendation: saturationBucket
      ? `Consider setting frequency caps near the ${saturationBucket} range and redirecting budget toward net-new reach campaigns.`
      : 'Continue monitoring frequency vs conversion curves bi-weekly and set caps once a clear diminishing-returns threshold emerges.',
  };
}

/* ── Part 4: Campaign mapping funnel ── */

function analyzeCampaignMapping(
  dspData: Record<string, string>[],
  dspHeaders: string[],
  saData: Record<string, string>[],
  saHeaders: string[]
): InteractionInsight | null {
  const dspTypeCol = findCol(dspHeaders, ['campaign_type', 'campaign_group', 'funnel', 'tactic', 'label', 'tof', 'mof', 'bof']);
  const saTypeCol = findCol(saHeaders, ['campaign_type', 'campaign_group', 'ad_type', 'targeting_type']);

  if (!dspTypeCol && !saTypeCol) return null;

  const hasTOF = dspData.some(r => {
    const stage = matchFunnelStage(r[dspTypeCol || ''] || '');
    return stage?.key === 'TOF';
  });
  const hasMOF = dspData.some(r => {
    const stage = matchFunnelStage(r[dspTypeCol || ''] || '');
    return stage?.key === 'MOF';
  });
  const hasBOF = dspData.some(r => {
    const stage = matchFunnelStage(r[dspTypeCol || ''] || '');
    return stage?.key === 'BOF';
  });
  const hasSADemand = saData.length > 0;

  if (!hasTOF && !hasMOF && !hasBOF) return null;

  const observations: string[] = [];
  if (hasTOF) observations.push('DSP top-of-funnel (TOF) campaigns are actively supporting awareness and discovery.');
  if (hasMOF) observations.push('DSP mid-funnel (MOF) campaigns are driving consideration and engagement.');
  if (hasBOF) observations.push('DSP bottom-of-funnel (BOF) campaigns are reinforcing purchase intent through retargeting.');
  if (hasSADemand) observations.push('Sponsored Ads campaigns are positioned to capture the demand generated by DSP upper-funnel activity.');

  return {
    headline: 'DSP likely supports discovery and consideration, while Sponsored Ads helps capture intent.',
    observations: observations.slice(0, 3),
    soWhat: 'The campaign structure suggests a full-funnel reinforcement strategy where DSP builds awareness and consideration, and Sponsored Ads converts that demand. This dual-channel approach is consistent with the conversion patterns observed in the purchase path data.',
    recommendation: 'Review budget allocation across funnel stages. Ensure TOF/MOF DSP spend is proportionate to the net-new reach goals, and confirm Sponsored Ads is bidding competitively on the branded and category terms that DSP exposure is likely generating.',
  };
}

/* ── Main exported function ── */

export function computeInteractionAnalysis(
  dspData: Record<string, string>[] | null,
  dspHeaders: string[] | null,
  saData: Record<string, string>[] | null,
  saHeaders: string[] | null,
  purchasePathData: Record<string, string>[] | null,
  purchasePathHeaders: string[] | null,
  frequencyData: Record<string, string>[] | null,
  frequencyHeaders: string[] | null
): InteractionAnalysis {
  if (!dspData || !dspHeaders || !saData || !saHeaders) {
    return {
      available: false,
      unavailableReason: 'Both DSP and Sponsored Ads exports are required to evaluate dual-channel interaction.',
      insights: [],
    };
  }

  const dual = verifyDualChannel(dspData, dspHeaders, saData, saHeaders);
  if (!dual.active) {
    return { available: false, unavailableReason: dual.reason, insights: [] };
  }

  const insights: InteractionInsight[] = [];

  // Part 2
  if (purchasePathData && purchasePathHeaders) {
    const ppInsight = analyzePurchasePath(purchasePathData, purchasePathHeaders);
    if (ppInsight) insights.push(ppInsight);
  }

  // Part 3
  if (frequencyData && frequencyHeaders) {
    const freqInsight = analyzeFrequency(frequencyData, frequencyHeaders);
    if (freqInsight) insights.push(freqInsight);
  }

  // Part 4
  const mappingInsight = analyzeCampaignMapping(dspData, dspHeaders, saData, saHeaders);
  if (mappingInsight) insights.push(mappingInsight);

  // Fallback if both channels active but no deep insights
  if (insights.length === 0) {
    insights.push({
      headline: 'Both DSP and Sponsored Ads are active in the same reporting window.',
      observations: [
        'Both channels show spend and impressions during this period, confirming dual-channel coverage.',
        'The uploaded AMC data did not contain sufficient purchase-path or frequency detail to infer specific reinforcement patterns.',
      ],
      soWhat: 'Dual-channel activity is confirmed but deeper interaction analysis requires AMC purchase path and frequency data with the expected column structure.',
      recommendation: 'Ensure AMC use case exports include converter vs non-converter segmentation and frequency bucket breakdowns to unlock full interaction insights in the next reporting cycle.',
    });
  }

  return { available: true, insights };
}
