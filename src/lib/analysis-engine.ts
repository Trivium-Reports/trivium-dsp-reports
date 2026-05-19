/**
 * Deterministic Analysis Engine
 *
 * Computes section-level insights from uploaded CSV data.
 * Hard rules:
 *  - Only compute from uploaded data — never fabricate
 *  - Never infer unavailable metrics
 *  - Every narrative maps back to actual values
 *  - Use threshold-based conditional logic
 */

import { normalizeColumnName } from './csv-parser';
import { thresholdLabel, THRESHOLDS } from './metrics-glossary';
import type { CampaignMapping } from '@/components/CampaignMappingTable';

/* ── Shared helpers ── */

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

function pct(a: number, b: number): number {
  if (b === 0) return 0;
  return ((a - b) / b) * 100;
}

function fmtNum(n: number, decimals = 1): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
}

/* ── Output types ── */

export interface AnalysisInsight {
  headline: string;
  observations: string[];
  soWhat: string;
  recommendation: string;
}

export interface SectionAnalysis {
  sectionId: string;
  title: string;
  available: boolean;
  unavailableReason?: string;
  insights: AnalysisInsight[];
}

/* ═══════════════════════════════════════════════
   Section 1: Converters vs Non-Converters
   ═══════════════════════════════════════════════ */

export function analyzeConverters(
  data: Record<string, string>[] | null,
  headers: string[] | null,
  context?: { hasDsp?: boolean; hasSa?: boolean; campaignMappings?: CampaignMapping[] }
): SectionAnalysis {
  const base: SectionAnalysis = {
    sectionId: 'converters-analysis',
    title: 'Path to Purchase: Converters vs Non-Converters',
    available: false,
    insights: [],
  };

  if (!data || !headers || data.length === 0) {
    base.unavailableReason = 'Converters vs non-converters analysis unavailable because the AMC purchase path file was not uploaded.';
    return base;
  }

  const keyMetricCol = findCol(headers, ['key_metric', 'metric', 'kpi']);
  const customerTypeCol = findCol(headers, ['customer_type', 'segment', 'purchase', 'converter', 'purchase_flag']);
  const statsCol = findCol(headers, ['stats', 'value', 'stat', 'metric_value']);

  const isLongFormat = !!keyMetricCol && !!customerTypeCol && !!statsCol;

  if (!customerTypeCol && !keyMetricCol) {
    base.unavailableReason = 'Cannot identify customer_type or key_metric columns in the upload.';
    return base;
  }

  const metricDefs = [
    { id: 'ad_products_exposed_per_user', patterns: ['ad_products_exposed_per_user', 'ad_products_exposed', 'ad_product'], label: 'ad products exposed per user', higherIsBetter: true },
    { id: 'total_impressions_per_user', patterns: ['total_impressions_per_user', 'impressions_per_user', 'avg_impressions'], label: 'total impressions per user', higherIsBetter: true },
    { id: 'impressions_per_user_per_ad_product', patterns: ['impressions_per_user_per_ad_product', 'imp_per_user_per_product'], label: 'impressions per user per ad product', higherIsBetter: true },
    { id: 'dpvs_per_user', patterns: ['dpvs_per_user', 'detail_page_views_per_user', 'dpv_per_user'], label: 'detail page views per user', higherIsBetter: true },
    { id: 'products_viewed_per_user', patterns: ['products_viewed_per_user', 'products_viewed'], label: 'products viewed per user', higherIsBetter: true },
    { id: 'days_to_purchase_per_user', patterns: ['days_to_purchase_per_user', 'days_to_purchase', 'avg_days_to_purchase'], label: 'days to purchase per user', higherIsBetter: false },
  ];

  interface MetricComparison {
    label: string;
    converterVal: number;
    nonConverterVal: number;
    delta: number;
    higherIsBetter: boolean;
  }

  const comparisons: MetricComparison[] = [];

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

      comparisons.push({ label: m.label, converterVal: cVal, nonConverterVal: ncVal, delta: pct(cVal, ncVal), higherIsBetter: m.higherIsBetter });
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

    if (purchaseRows.length === 0 || noPurchaseRows.length === 0) {
      base.unavailableReason = 'Could not identify Purchase vs No Purchase segments in uploaded data.';
      return base;
    }

    for (const m of metricDefs) {
      const col = findCol(headers, m.patterns);
      if (!col) continue;
      const cVal = purchaseRows.reduce((a, r) => a + num(r[col]), 0) / purchaseRows.length;
      const ncVal = noPurchaseRows.reduce((a, r) => a + num(r[col]), 0) / noPurchaseRows.length;
      comparisons.push({ label: m.label, converterVal: cVal, nonConverterVal: ncVal, delta: pct(cVal, ncVal), higherIsBetter: m.higherIsBetter });
    }
  }

  if (comparisons.length === 0) {
    base.unavailableReason = 'No recognized purchase path metrics found in the uploaded file.';
    return base;
  }

  base.available = true;
  const observations: string[] = [];

  // Rule: Multi-format exposure
  const adProducts = comparisons.find(c => c.label.includes('ad products'));
  if (adProducts && adProducts.delta >= THRESHOLDS.MATERIALLY_HIGHER) {
    observations.push(
      `Converters were exposed to ${adProducts.converterVal.toFixed(1)} ad products per user vs ${adProducts.nonConverterVal.toFixed(1)} for non-converters (${fmtPct(adProducts.delta)}). They are not just seeing more ads — they are encountering more formats before buying.`
    );
  }

  // Rule: DPV engagement
  const dpvs = comparisons.find(c => c.label.includes('detail page views'));
  if (dpvs && dpvs.delta >= THRESHOLDS.MATERIALLY_HIGHER) {
    const ratio = dpvs.nonConverterVal > 0 ? dpvs.converterVal / dpvs.nonConverterVal : 0;
    const ratioNote = ratio >= 1.5 ? ` — ${ratio.toFixed(1)}x the rate of non-converters` : '';
    observations.push(
      `Converters averaged ${dpvs.converterVal.toFixed(1)} detail page views per user vs ${dpvs.nonConverterVal.toFixed(1)}${ratioNote}. This is not passive exposure. Converters are actively researching product pages before committing.`
    );
  }

  // Rule: Products viewed
  const prodViewed = comparisons.find(c => c.label.includes('products viewed'));
  if (prodViewed && prodViewed.delta >= THRESHOLDS.MATERIALLY_HIGHER) {
    observations.push(
      `Converters browsed ${prodViewed.converterVal.toFixed(1)} products vs ${prodViewed.nonConverterVal.toFixed(1)} for non-converters. The purchase path involves broader consideration — cross-ASIN exploration is part of how these buyers decide.`
    );
  }

  // Rule: Impression depth
  const totalImp = comparisons.find(c => c.label.includes('total impressions'));
  if (totalImp && totalImp.delta >= THRESHOLDS.MATERIALLY_HIGHER) {
    observations.push(
      `Converters received ${totalImp.converterVal.toFixed(1)} impressions per user vs ${totalImp.nonConverterVal.toFixed(1)} (${fmtPct(totalImp.delta)}). Repeated exposure across touchpoints is building conversion readiness, not creating fatigue.`
    );
  }

  // Rule: Long purchase windows
  const days = comparisons.find(c => c.label.includes('days to purchase'));
  if (days && days.converterVal > days.nonConverterVal) {
    const daysDelta = days.converterVal - days.nonConverterVal;
    observations.push(
      `Converters take ${days.converterVal.toFixed(1)} days to purchase — ${daysDelta.toFixed(1)} days longer than non-converters. This is a considered purchase cycle. Do not cut upper-funnel spend based on direct ROAS alone if it is building the consideration that leads to conversion.`
    );
  }

  // Rule: Low-exposure non-converters
  if (adProducts && dpvs && adProducts.nonConverterVal < 1.5 && dpvs.nonConverterVal < 1) {
    observations.push(
      `Non-converters averaged only ${adProducts.nonConverterVal.toFixed(1)} ad products and ${dpvs.nonConverterVal.toFixed(1)} DPVs. These users barely entered the funnel. Stronger retargeting could move them from awareness into genuine consideration.`
    );
  } else if (adProducts && adProducts.nonConverterVal < 2 && adProducts.delta >= THRESHOLDS.MATERIALLY_HIGHER) {
    observations.push(
      `Non-converters saw only ${adProducts.nonConverterVal.toFixed(1)} ad products. The gap between converters and non-converters is about exposure depth, not just intent — under-exposed users may convert with stronger mid-funnel coverage.`
    );
  }

  if (observations.length === 0) {
    observations.push(
      `Converter and non-converter engagement metrics fall within a narrow range. No single metric shows a ${THRESHOLDS.MATERIALLY_HIGHER}%+ gap. Continue monitoring bi-weekly for emerging patterns.`
    );
  }

  // ── Cross-channel context ──
  const hasDsp = context?.hasDsp ?? false;
  const hasSa = context?.hasSa ?? false;
  const dualChannel = hasDsp && hasSa;
  const mappings = context?.campaignMappings ?? [];
  const hasFunnelLabels = mappings.some(m => ['TOF', 'MOF', 'BOF'].includes(m.label));

  const hasUnderExposure = adProducts && adProducts.nonConverterVal < 1.5;
  const hasLongPurchase = days && days.converterVal > days.nonConverterVal;
  const hasDeepEngagement = dpvs && dpvs.delta >= THRESHOLDS.MEANINGFULLY_HIGHER;
  const hasMultiFormatGap = adProducts && adProducts.delta >= THRESHOLDS.MATERIALLY_HIGHER;
  const hasImpressionDepth = totalImp && totalImp.delta >= THRESHOLDS.MATERIALLY_HIGHER;

  // Cross-channel observations when both DSP + SA are active and depth metrics are strong
  const crossChannelSignal = dualChannel && (hasDeepEngagement || hasMultiFormatGap || hasImpressionDepth);

  if (crossChannelSignal) {
    observations.push(
      'This pattern is consistent with DSP driving discovery and repeated exposure while Sponsored Ads captures intent closer to purchase. Converters are moving through a broader cross-channel journey before buying.'
    );
    observations.push(
      'The gap suggests upper-funnel media is contributing to conversion readiness, even if last-touch metrics understate that role. This is a multi-touch path, not a single-channel conversion story.'
    );
  }

  if (crossChannelSignal && hasFunnelLabels) {
    observations.push(
      'With TOF/MOF DSP building awareness and consideration, and Sponsored Ads harvesting active demand, the path to purchase reflects the full funnel sequence. The engagement depth gap between converters and non-converters reinforces that this sequence is working.'
    );
  }

  // Strategic recommendation
  let recText: string;

  if (crossChannelSignal && hasUnderExposure) {
    recText = 'Increase mid-funnel retargeting frequency for under-exposed users. DSP is building the consideration that Sponsored Ads converts — protect that investment and close the exposure gap for users who never made it past initial awareness.';
  } else if (crossChannelSignal) {
    recText = 'Evaluate DSP on its assist contribution — consideration depth, DPV rate, and branded search lift — not last-touch ROAS. Sponsored Ads captures the demand that DSP helps create. Cutting upper-funnel spend risks weakening the pipeline Sponsored Ads relies on.';
  } else if (hasUnderExposure && hasDeepEngagement) {
    recText = 'Increase mid-funnel retargeting frequency for users with limited ad product exposure. Protect upper-funnel DSP investment — it is driving the PDP engagement that precedes conversion.';
  } else if (hasLongPurchase) {
    recText = 'Evaluate DSP on assist metrics — branded search lift, DPV rate, and consideration depth — not last-touch ROAS. The purchase cycle is long enough that direct attribution undervalues upper-funnel contribution.';
  } else if (hasDeepEngagement) {
    recText = 'Maintain DSP investment that drives PDP engagement. The data shows converters actively research before buying — protect the exposure that feeds that behavior.';
  } else {
    recText = 'Monitor exposure-group conversion trends bi-weekly. The current data shows directional differences without a definitive pattern yet.';
  }

  // Build "So What?" — channel-explicit when dual-channel
  let soWhatText: string;
  if (crossChannelSignal) {
    soWhatText = 'The engagement gap suggests DSP is helping build consideration before purchase, while Sponsored Ads captures demand once intent matures. This is cross-channel reinforcement, not just more impressions. Evaluate upper-funnel media on its contribution to consideration depth and downstream conversion readiness, not last-touch ROAS alone.';
  } else if (hasDeepEngagement) {
    soWhatText = 'The engagement gap between converters and non-converters confirms that upper-funnel investment is building conversion readiness. This is assist value. Evaluate DSP on consideration depth and branded search lift, not last-touch ROAS alone.';
  } else if (hasLongPurchase) {
    soWhatText = 'Longer purchase cycles mean upper-funnel activity is assisting downstream conversion over time. Cutting DSP to improve short-term ROAS risks weakening the consideration pipeline that feeds Sponsored Ads.';
  } else {
    soWhatText = 'Directional differences exist between converters and non-converters. Continue monitoring purchase path metrics to confirm whether emerging patterns warrant strategic shifts.';
  }

  base.insights.push({
    headline: crossChannelSignal
      ? 'Converters are not just seeing more ads — they are moving through a cross-channel journey before buying.'
      : observations.length > 1
        ? 'Converters are not just seeing more ads — they are exploring more deeply before purchase.'
        : 'Converter vs non-converter differences are within normal ranges for this period.',
    observations,
    soWhat: soWhatText,
    recommendation: recText,
  });

  return base;
}

/* ═══════════════════════════════════════════════
   Section 2: Optimal Frequency
   ═══════════════════════════════════════════════ */

export function analyzeFrequency(
  data: Record<string, string>[] | null,
  headers: string[] | null
): SectionAnalysis {
  const base: SectionAnalysis = {
    sectionId: 'frequency-analysis',
    title: 'Optimal Frequency',
    available: false,
    insights: [],
  };

  if (!data || !headers || data.length === 0) {
    base.unavailableReason = 'Optimal frequency analysis unavailable because the AMC frequency export was not uploaded.';
    return base;
  }

  const freqCol = findCol(headers, ['frequency_bucket', 'frequency', 'freq']);
  if (!freqCol) {
    base.unavailableReason = 'Cannot identify frequency_bucket column.';
    return base;
  }

  const sorted = [...data].sort((a, b) => {
    const aNum = parseInt(a[freqCol]?.replace(/[^0-9]/g, '') || '0');
    const bNum = parseInt(b[freqCol]?.replace(/[^0-9]/g, '') || '0');
    return aNum - bNum;
  });

  if (sorted.length < 3) {
    base.unavailableReason = 'Frequency data needs at least 3 buckets for analysis.';
    return base;
  }

  base.available = true;

  const purchRateCol = findCol(headers, ['purchase_rate', 'purchases', 'purchase', 'conversion_rate']);
  const dpvCol = findCol(headers, ['detail_page_view_rate', 'detail_page_views', 'dpvr']);
  const searchCol = findCol(headers, ['branded_search_rate', 'branded_searches', 'branded_search']);
  const reachCol = findCol(headers, ['reach', 'users']);
  const impCol = findCol(headers, ['impressions', 'impression']);
  const purchasesCol = findCol(headers, ['purchases', 'purchasers', 'buyers']);

  // Derive purchase_rate if not directly available
  const hasDerivedRate = !findCol(headers, ['purchase_rate', 'conversion_rate']) && !!purchasesCol && !!reachCol;

  const getRateForRow = (r: Record<string, string>): number => {
    if (!hasDerivedRate && purchRateCol) return num(r[purchRateCol]);
    if (purchasesCol && reachCol) {
      const reach = num(r[reachCol]);
      return reach > 0 ? (num(r[purchasesCol]) / reach) * 100 : 0;
    }
    return 0;
  };

  const canComputeRate = !!purchRateCol || (!!purchasesCol && !!reachCol);
  const observations: string[] = [];
  let efficientStart: string | null = null;
  let peakBucket: string | null = null;
  let saturationBucket: string | null = null;
  let wasteBuckets: string[] = [];

  // Compute percent reach/impressions by bucket
  const totalReach = reachCol ? sorted.reduce((a, r) => a + num(r[reachCol]), 0) : 0;
  const totalImps = impCol ? sorted.reduce((a, r) => a + num(r[impCol]), 0) : 0;
  const avgFrequency = totalReach > 0 && totalImps > 0 ? totalImps / totalReach : 0;

  if (avgFrequency > 0) {
    observations.push(`Average frequency across all buckets: ${avgFrequency.toFixed(1)} impressions per user.`);
  }

  // Purchase rate curve — identify all 4 bands
  if (canComputeRate) {
    const rates = sorted.map(r => ({
      bucket: r[freqCol],
      rate: getRateForRow(r),
      reach: reachCol ? num(r[reachCol]) : 0,
      impressions: impCol ? num(r[impCol]) : 0,
    }));
    
    let peakIdx = 0;
    for (let i = 1; i < rates.length; i++) {
      if (rates[i].rate > rates[peakIdx].rate) peakIdx = i;
    }
    peakBucket = rates[peakIdx].bucket;

    const baseRate = rates[0].rate;
    for (let i = 1; i <= peakIdx; i++) {
      if (pct(rates[i].rate, baseRate) >= 5 && !efficientStart) {
        efficientStart = rates[i].bucket;
      }
    }

    if (peakIdx < rates.length - 1) {
      const peakRate = rates[peakIdx].rate;
      for (let i = peakIdx + 1; i < rates.length; i++) {
        const dropPct = pct(rates[i].rate, peakRate);
        if (dropPct < -5 && !saturationBucket) {
          saturationBucket = rates[i].bucket;
        }
        if (dropPct < -10) {
          wasteBuckets.push(rates[i].bucket);
        }
      }
    }

    // Band summary
    const bandParts: string[] = [];
    if (efficientStart) bandParts.push(`Building → Efficient: ${efficientStart}–${peakBucket}`);
    if (peakBucket) bandParts.push(`Peak: ${peakBucket} at ${rates[peakIdx].rate.toFixed(2)}%`);
    if (saturationBucket) bandParts.push(`Diminishing: ${saturationBucket}+`);
    if (wasteBuckets.length > 0) bandParts.push(`Waste: ${wasteBuckets[0]}+`);

    if (bandParts.length > 0) {
      observations.push(`${bandParts.join(' · ')}.${hasDerivedRate ? ' (purchase_rate derived from purchases ÷ reach)' : ''}`);
    }

    if (peakIdx > 0) {
      const improvement = pct(rates[peakIdx].rate, baseRate);
      observations.push(
        `Purchase rate climbs ${fmtPct(improvement)} from bucket 1 (${baseRate.toFixed(2)}%) to peak at ${peakBucket} (${rates[peakIdx].rate.toFixed(2)}%). Each additional exposure through this range is earning its keep.`
      );
    }

    // Reach/impression concentration in waste band
    if (saturationBucket) {
      observations.push(
        `Past the ${saturationBucket} bucket, performance flattens or declines. Frequency is approaching saturation — incremental spend beyond this point is at risk of turning into waste.`
      );
    }

    if (wasteBuckets.length > 0 && reachCol) {
      const wasteReach = sorted
        .filter(r => wasteBuckets.includes(r[freqCol]))
        .reduce((a, r) => a + num(r[reachCol]), 0);
      const wasteImpressions = impCol ? sorted
        .filter(r => wasteBuckets.includes(r[freqCol]))
        .reduce((a, r) => a + num(r[impCol]), 0) : 0;
      const pctWasteReach = totalReach > 0 ? (wasteReach / totalReach) * 100 : 0;
      const pctWasteImps = totalImps > 0 ? (wasteImpressions / totalImps) * 100 : 0;
      if (wasteReach > 0) {
        observations.push(
          `Roughly ${fmtNum(wasteReach)} users sit in the waste band (${wasteBuckets[0]}+)${wasteImpressions > 0 ? `, absorbing ${fmtNum(wasteImpressions)} impressions (${pctWasteImps.toFixed(1)}% of total)` : ''} — ${pctWasteReach.toFixed(1)}% of reach — with minimal incremental conversion value. This budget would work harder against fresh audiences.`
        );
      }
    }
  } else if (dpvCol || searchCol || findCol(headers, ['ctr', 'click_through_rate'])) {
    // Engagement-only frequency analysis using CTR, branded search rate, and DPV rate
    const ctrCol = findCol(headers, ['ctr', 'click_through_rate']);
    const engagementMetrics: { col: string; label: string }[] = [];
    if (dpvCol) engagementMetrics.push({ col: dpvCol, label: 'DPV rate' });
    if (ctrCol) engagementMetrics.push({ col: ctrCol, label: 'CTR' });
    if (searchCol) engagementMetrics.push({ col: searchCol, label: 'branded search rate' });

    observations.push(
      `Purchase rate is not available in this dataset. Analyzing frequency through engagement metrics: ${engagementMetrics.map(m => m.label).join(', ')}.`
    );

    for (const metric of engagementMetrics) {
      const engRates = sorted.map((r, i) => ({ bucket: r[freqCol], rate: num(r[metric.col]), idx: i }));
      let flatStart: string | null = null;
      for (let i = 2; i < engRates.length; i++) {
        const prevDelta = engRates[i].rate - engRates[i - 1].rate;
        const prevPrevDelta = engRates[i - 1].rate - engRates[i - 2].rate;
        if (prevDelta <= 0 && prevPrevDelta <= 0 && !flatStart) {
          flatStart = engRates[i - 1].bucket;
        }
      }
      if (flatStart) {
        if (!saturationBucket) saturationBucket = flatStart;
        observations.push(
          `${metric.label} stops increasing meaningfully at bucket ${flatStart}. This signals diminishing engagement returns even without direct conversion data.`
        );
      } else {
        const peakVal = Math.max(...engRates.map(e => e.rate));
        const peakB = engRates.find(e => e.rate === peakVal)?.bucket;
        if (peakB) {
          observations.push(
            `${metric.label} peaks at bucket ${peakB} (${peakVal.toFixed(2)}%). No clear flattening detected — frequency may still have room to work.`
          );
        }
      }
    }
  }

  // DPV rate through frequency lens
  if (dpvCol) {
    const midIdx = Math.floor(sorted.length / 2);
    const earlyAvg = sorted.slice(0, midIdx).reduce((a, r) => a + num(r[dpvCol]), 0) / midIdx;
    const lateAvg = sorted.slice(midIdx).reduce((a, r) => a + num(r[dpvCol]), 0) / (sorted.length - midIdx);
    const diff = pct(lateAvg, earlyAvg);

    if (diff >= THRESHOLDS.MATERIALLY_HIGHER) {
      observations.push(
        `PDP engagement runs ${fmtPct(diff)} higher in upper frequency bands (${lateAvg.toFixed(2)}% vs ${earlyAvg.toFixed(2)}%). Deeper exposure is driving product exploration — the efficient range still has room to work.`
      );
    } else if (diff < -THRESHOLDS.MATERIALLY_HIGHER) {
      observations.push(
        `PDP engagement drops ${fmtPct(Math.abs(diff))} at higher frequencies (${lateAvg.toFixed(2)}% vs ${earlyAvg.toFixed(2)}%). Users past the efficient band are tuning out — more impressions are not driving deeper consideration.`
      );
    }
  }

  // Branded search through frequency lens
  if (searchCol) {
    const midIdx = Math.floor(sorted.length / 2);
    const earlyAvg = sorted.slice(0, midIdx).reduce((a, r) => a + num(r[searchCol]), 0) / midIdx;
    const lateAvg = sorted.slice(midIdx).reduce((a, r) => a + num(r[searchCol]), 0) / (sorted.length - midIdx);
    const diff = pct(lateAvg, earlyAvg);

    if (diff >= THRESHOLDS.MATERIALLY_HIGHER) {
      observations.push(
        `Branded search activity rises ${fmtPct(diff)} at higher frequency bands. DSP exposure is creating demand that Sponsored Ads can capture — this is assist value visible through frequency depth.`
      );
    }
  }

  if (observations.length === 0) {
    observations.push('No clear purchase rate peak or saturation threshold emerged from this data. Continue collecting frequency data to establish a reliable curve.');
  }

  // Strategic recommendation
  let freqRec: string;
  if (wasteBuckets.length > 0 && saturationBucket) {
    freqRec = `Cap frequency near the ${saturationBucket} range. Redirect waste-band budget (${wasteBuckets[0]}+) to net-new reach or fresh creative. Consider refreshing assets for users approaching saturation to extend the efficient window.`;
  } else if (saturationBucket) {
    freqRec = `Set frequency caps near ${saturationBucket}. Shift the budget freed up toward prospecting or net-new audience segments where each impression carries more incremental value.`;
  } else if (peakBucket) {
    freqRec = `Performance peaks around ${peakBucket}. Set a provisional cap and test whether reallocating upper-frequency budget to fresh audiences improves overall efficiency.`;
  } else {
    freqRec = 'Continue collecting frequency data across reporting periods to establish a reliable curve before setting hard caps.';
  }

  base.insights.push({
    headline: peakBucket
      ? `Performance peaks at frequency ${peakBucket}${saturationBucket ? ` — diminishing returns begin at ${saturationBucket}` : ''}${wasteBuckets.length > 0 ? `, with wasted spend at ${wasteBuckets[0]}+` : ''}.`
      : 'Frequency curve does not yet show a definitive peak. Monitoring continues.',
    observations,
    soWhat: saturationBucket
      ? 'Every impression past the ' + saturationBucket + ' band earns less than the one before it. Budget in this range is not building conversion. Reallocate to fresh audiences, tighten caps, or refresh creative to extend the efficient window.'
      : 'No clear saturation threshold is visible yet. Continue monitoring frequency curves bi-weekly — when diminishing returns emerge, act quickly to cap and redirect.',
    recommendation: freqRec,
  });

  return base;
}

/* ===============================================
   Section 3: Net-New Reach
   =============================================== */

export function analyzeNetNewReach(
  data: Record<string, string>[] | null,
  headers: string[] | null,
  campaignMappings: CampaignMapping[]
): SectionAnalysis {
  const base: SectionAnalysis = {
    sectionId: 'reach-analysis',
    title: 'Net-New Reach by Campaign Group',
    available: false,
    insights: [],
  };

  if (!data || !headers || data.length === 0) {
    base.unavailableReason = 'Net-new reach analysis unavailable because the AMC net-new reach export was not uploaded.';
    return base;
  }

  const groupCol = findCol(headers, ['campaign_group', 'campaign', 'group']);
  const nnReachCol = findCol(headers, ['net_new_reach', 'new_reach']);
  const nnPurchCol = findCol(headers, ['net_new_users_who_purchased', 'net_new_purchasers']);
  const nnSalesCol = findCol(headers, ['net_new_sales']);
  const nnClickCol = findCol(headers, ['net_new_users_who_clicked', 'net_new_clickers']);
  const totalReachCol = findCol(headers, ['total_reach', 'total_users']);
  const totalImpCol = findCol(headers, ['total_impressions']);

  if (!nnReachCol) {
    base.unavailableReason = 'Cannot identify net_new_reach column in the uploaded file.';
    return base;
  }

  base.available = true;
  const observations: string[] = [];
  let hasWeakCapture = false;
  let hasTofAssist = false;

  const groups = groupCol ? [...new Set(data.map(r => r[groupCol]))] : ['All'];
  const nnImpCol = findCol(headers, ['net_new_impressions']);

  for (const group of groups) {
    const rows = groupCol ? data.filter(r => r[groupCol] === group) : data;
    const nnReach = rows.reduce((a, r) => a + num(r[nnReachCol]), 0);
    const totalReach = totalReachCol ? rows.reduce((a, r) => a + num(r[totalReachCol]), 0) : 0;
    const nnPurch = nnPurchCol ? rows.reduce((a, r) => a + num(r[nnPurchCol]), 0) : 0;
    const nnSales = nnSalesCol ? rows.reduce((a, r) => a + num(r[nnSalesCol]), 0) : 0;
    const nnClicks = nnClickCol ? rows.reduce((a, r) => a + num(r[nnClickCol]), 0) : 0;
    const totalImps = totalImpCol ? rows.reduce((a, r) => a + num(r[totalImpCol]), 0) : 0;
    const nnImps = nnImpCol ? rows.reduce((a, r) => a + num(r[nnImpCol]), 0) : 0;

    const nnShare = totalReach > 0 ? (nnReach / totalReach) * 100 : 0;
    const nnConvRate = nnReach > 0 && nnPurchCol ? (nnPurch / nnReach) * 100 : 0;
    const nnClickRate = nnReach > 0 && nnClickCol ? (nnClicks / nnReach) * 100 : 0;
    const nnImpShare = totalImps > 0 && nnImps > 0 ? (nnImps / totalImps) * 100 : 0;

    const mapping = campaignMappings.find(m =>
      group.toLowerCase().includes(m.campaignName.toLowerCase()) ||
      m.campaignName.toLowerCase().includes(group.toLowerCase())
    );
    const stageLabel = mapping?.label || '';
    const groupLabel = stageLabel ? `${group} (${stageLabel})` : group;

    // Core metrics line
    if (totalReach > 0 && nnShare > 0) {
      let line = `${groupLabel}: ${fmtNum(nnReach)} net-new users (${nnShare.toFixed(1)}% of total reach).`;
      if (nnImpShare > 0) line += ` ${nnImpShare.toFixed(1)}% of impressions reached net-new users.`;
      if (nnClickCol && nnClicks > 0) line += ` Click rate: ${nnClickRate.toFixed(2)}%.`;
      if (nnPurchCol) line += ` Purchase rate: ${nnConvRate.toFixed(2)}% (${fmtNum(nnPurch)} purchasers).`;
      if (nnSalesCol && nnSales > 0) line += ` Net-new sales: $${fmtNum(nnSales)}.`;
      observations.push(line);
    }

    // Diagnostic: high reach but low purchase efficiency
    if (nnShare > 50 && nnConvRate < 0.5 && nnPurchCol) {
      hasWeakCapture = true;
      observations.push(
        `${groupLabel} is expanding the audience pool effectively (${nnShare.toFixed(0)}% net-new), but downstream capture is weak at ${nnConvRate.toFixed(2)}%. Prospecting is successfully reaching new users — the gap is in converting them. Mid-funnel retargeting needs to close the distance.`
      );
    }

    // Diagnostic: strong net-new efficiency
    if (nnConvRate > 1 && nnPurchCol) {
      observations.push(
        `${groupLabel} is converting net-new users at ${nnConvRate.toFixed(2)}% — above-average efficiency. This is a campaign group worth scaling selectively.`
      );
    }
  }

  // TOF as assist engine logic
  if (campaignMappings.length > 0 && groups.length > 1 && totalReachCol) {
    const tofGroups = groups.filter(g => {
      const m = campaignMappings.find(cm =>
        g.toLowerCase().includes(cm.campaignName.toLowerCase())
      );
      return m?.label === 'TOF';
    });

    if (tofGroups.length > 0) {
      const tofRows = data.filter(r => groupCol && tofGroups.includes(r[groupCol]));
      const tofNNReach = tofRows.reduce((a, r) => a + num(r[nnReachCol]), 0);
      const tofNNPurch = nnPurchCol ? tofRows.reduce((a, r) => a + num(r[nnPurchCol]), 0) : 0;
      const tofConvRate = tofNNReach > 0 ? (tofNNPurch / tofNNReach) * 100 : 0;

      if (tofNNReach > 0 && tofConvRate < 0.5 && nnPurchCol) {
        hasTofAssist = true;
        observations.push(
          `TOF direct purchase rate is low (${tofConvRate.toFixed(2)}%), but it reached ${fmtNum(tofNNReach)} net-new users. TOF is not a conversion channel — it is an assist engine that feeds the mid- and lower-funnel. Judge it on reach, branded search lift, and PDP views, not direct ROAS.`
        );
      }
    }
  }

  if (observations.length === 0) {
    observations.push('Net-new reach data was uploaded but no clear expansion or efficiency patterns emerged. Continue monitoring across reporting periods.');
  }

  // Strategic recommendation
  let reachRec: string;
  if (hasWeakCapture && hasTofAssist) {
    reachRec = 'Add mid-funnel retargeting sequences for newly reached users before scaling further prospecting. TOF is doing its job on reach — the gap is in capture. Evaluate TOF on assist metrics, not direct conversion.';
  } else if (hasWeakCapture) {
    reachRec = 'Prospecting is successfully expanding the audience pool, but downstream capture must improve. Strengthen mid-funnel retargeting before increasing top-of-funnel spend.';
  } else if (hasTofAssist) {
    reachRec = 'Scale TOF selectively where net-new efficiency is strongest. Protect the funnel by maintaining investment that feeds downstream conversion — do not evaluate TOF on direct ROAS.';
  } else {
    reachRec = 'Shift budget toward campaign groups with the strongest net-new purchase rates. Deprioritize groups where reach is broad but conversion remains flat.';
  }

  base.insights.push({
    headline: hasWeakCapture
      ? 'Prospecting is expanding reach, but downstream capture needs work.'
      : hasTofAssist
        ? 'TOF is building the audience pool — evaluate on assist value, not direct conversion.'
        : 'Net-new reach analysis by campaign group.',
    observations,
    soWhat: hasWeakCapture
      ? 'High net-new reach with weak purchase efficiency is a mid-funnel problem, not a prospecting problem. The audience is new — but they are not converting because the retargeting layer is not catching them. Fix the middle before scaling the top.'
      : 'Net-new reach separates prospecting value from retargeting value. Strong net-new share with strong purchase efficiency validates TOF investment. Strong share with weak efficiency signals a capture gap downstream.',
    recommendation: reachRec,
  });

  return base;
}

/* ═══════════════════════════════════════════════
   Section 4: Exposure Group Analysis
   ═══════════════════════════════════════════════ */

export function analyzeExposureGroups(
  data: Record<string, string>[] | null,
  headers: string[] | null
): SectionAnalysis {
  const base: SectionAnalysis = {
    sectionId: 'exposure-group-analysis',
    title: 'DSP + Sponsored Ads Interaction',
    available: false,
    insights: [],
  };

  if (!data || !headers || data.length === 0) {
    base.unavailableReason = 'DSP + Sponsored Ads interaction analysis unavailable because the AMC interaction file was not uploaded.';
    return base;
  }

  const groupCol = findCol(headers, ['exposure_group', 'group', 'segment', 'channel_group']);
  const usersCol = findCol(headers, ['users_exposed', 'users', 'reach', 'exposed_users']);
  const purchCol = findCol(headers, ['purchasers', 'converters', 'buyers']);

  if (!groupCol || !usersCol || !purchCol) {
    base.unavailableReason = 'Cannot identify exposure_group, users_exposed, and purchasers columns.';
    return base;
  }

  base.available = true;

  interface GroupData {
    name: string;
    users: number;
    purchasers: number;
    convRate: number;
  }

  const groupData: GroupData[] = data.map(r => {
    const users = num(r[usersCol]);
    const purch = num(r[purchCol]);
    return {
      name: r[groupCol],
      users,
      purchasers: purch,
      convRate: users > 0 ? (purch / users) * 100 : 0,
    };
  }).filter(g => g.users > 0);

  if (groupData.length === 0) {
    base.unavailableReason = 'Exposure group data has no rows with users > 0.';
    base.available = false;
    return base;
  }

  const observations: string[] = [];
  let hasMeaningfulReinforcement = false;

  const findGroup = (patterns: string[], exclude?: string[]) =>
    groupData.find(g => {
      const n = g.name.toLowerCase();
      return patterns.some(p => n.includes(p)) && !(exclude || []).some(e => n.includes(e));
    });

  const dualGroup = findGroup(['dsp + sponsored', 'both', 'dual']) ||
    groupData.find(g => {
      const n = g.name.toLowerCase();
      return n.includes('dsp') && n.includes('sponsored');
    });
  const sponsoredOnly = findGroup(['sponsored only', 'sa only']) ||
    groupData.find(g => {
      const n = g.name.toLowerCase();
      return n.includes('sponsored') && !n.includes('dsp') && !n.includes('+');
    });
  const dspOnly = findGroup(['dsp only']) ||
    groupData.find(g => {
      const n = g.name.toLowerCase();
      return n.includes('dsp') && !n.includes('sponsored') && !n.includes('+');
    });
  const fullFunnel = groupData.find(g => {
    const n = g.name.toLowerCase();
    return (n.includes('tof') && n.includes('mof') && n.includes('sponsored')) ||
           n.includes('full funnel') || n.includes('all stages');
  });
  const mofOnly = groupData.find(g => {
    const n = g.name.toLowerCase();
    return n.includes('mof') && !n.includes('tof') && !n.includes('bof');
  });

  // PRIMARY: DSP + Sponsored vs Sponsored Only
  if (dualGroup && sponsoredOnly) {
    const delta = pct(dualGroup.convRate, sponsoredOnly.convRate);
    if (delta > THRESHOLDS.MATERIALLY_HIGHER) {
      hasMeaningfulReinforcement = true;
      observations.push(
        `Users exposed to both DSP and Sponsored Ads convert at ${dualGroup.convRate.toFixed(2)}% — vs ${sponsoredOnly.convRate.toFixed(2)}% for Sponsored-only (${fmtPct(delta)} lift). Dual exposure is reinforcing intent, not just overlapping audiences.`
      );
    } else if (delta > 0) {
      observations.push(
        `Dual-channel users convert at ${dualGroup.convRate.toFixed(2)}% vs ${sponsoredOnly.convRate.toFixed(2)}% for Sponsored-only (${fmtPct(delta)}). Directional lift, but not yet at the ${THRESHOLDS.MATERIALLY_HIGHER}% threshold for confident reinforcement.`
      );
    }
  }

  // DSP + Sponsored vs DSP Only
  if (dualGroup && dspOnly) {
    const delta = pct(dualGroup.convRate, dspOnly.convRate);
    if (delta > THRESHOLDS.MATERIALLY_HIGHER) {
      observations.push(
        `Dual-channel converts ${fmtPct(delta)} higher than DSP-only (${dualGroup.convRate.toFixed(2)}% vs ${dspOnly.convRate.toFixed(2)}%). Adding Sponsored Ads as a capture layer materially improves conversion on DSP-primed audiences.`
      );
    }
  }

  // TOF+MOF+Sponsored vs MOF only
  if (fullFunnel && mofOnly) {
    const delta = pct(fullFunnel.convRate, mofOnly.convRate);
    if (delta > THRESHOLDS.MATERIALLY_HIGHER) {
      hasMeaningfulReinforcement = true;
      observations.push(
        `Full-funnel users (TOF+MOF+Sponsored) convert at ${fullFunnel.convRate.toFixed(2)}% vs ${mofOnly.convRate.toFixed(2)}% for MOF-only (${fmtPct(delta)}). The complete funnel outperforms mid-funnel retargeting alone — TOF is earning its place.`
      );
    }
  }

  // DSP Only assist behavior
  if (dspOnly && dspOnly.convRate < 0.5 && dualGroup && dualGroup.convRate > dspOnly.convRate * 2) {
    observations.push(
      `DSP-only conversion is ${dspOnly.convRate.toFixed(2)}% — weak in isolation. But when combined with Sponsored Ads, conversion jumps to ${dualGroup.convRate.toFixed(2)}%. DSP is not a standalone conversion channel. It is an assist layer that lifts everything downstream.`
    );
  }

  // Remaining groups summary
  const primaryGroups = [dualGroup, sponsoredOnly, dspOnly, fullFunnel, mofOnly].filter(Boolean);
  for (const g of groupData) {
    if (primaryGroups.includes(g)) continue;
    observations.push(
      `${g.name}: ${fmtNum(g.users)} users, ${fmtNum(g.purchasers)} purchasers (${g.convRate.toFixed(2)}% conversion).`
    );
  }

  // Optional assist metrics
  const dpvCol = findCol(headers, ['dpvs_per_user', 'dpv_per_user']);
  const searchCol = findCol(headers, ['branded_searches_per_user', 'branded_search_per_user']);

  if (dpvCol && dualGroup && sponsoredOnly) {
    const dualDpv = num(data.find(r => r[groupCol] === dualGroup.name)?.[dpvCol]);
    const saDpv = num(data.find(r => r[groupCol] === sponsoredOnly.name)?.[dpvCol]);
    if (dualDpv > 0 && saDpv > 0) {
      const diff = pct(dualDpv, saDpv);
      if (diff >= THRESHOLDS.MATERIALLY_HIGHER) {
        observations.push(
          `Dual-channel users engage ${fmtPct(diff)} more on product pages (${dualDpv.toFixed(1)} vs ${saDpv.toFixed(1)} DPVs/user). DSP is not just adding impressions — it is deepening product consideration before Sponsored Ads captures intent.`
        );
      }
    }
  }

  if (searchCol && dualGroup && sponsoredOnly) {
    const dualSearch = num(data.find(r => r[groupCol] === dualGroup.name)?.[searchCol]);
    const saSearch = num(data.find(r => r[groupCol] === sponsoredOnly.name)?.[searchCol]);
    if (dualSearch > 0 && saSearch > 0) {
      const diff = pct(dualSearch, saSearch);
      if (diff >= THRESHOLDS.MATERIALLY_HIGHER) {
        observations.push(
          `Branded search runs ${fmtPct(diff)} higher for dual-channel users (${dualSearch.toFixed(1)} vs ${saSearch.toFixed(1)}/user). DSP is generating brand demand that Sponsored Ads is positioned to harvest.`
        );
      }
    }
  }

  if (observations.length === 0) {
    observations.push('Exposure group data was uploaded but no clear reinforcement signal emerged. Ensure sufficient DSP and Sponsored Ads overlap exists to evaluate dual-channel impact in the next cycle.');
  }

  // Strategic recommendation
  let expRec: string;
  if (hasMeaningfulReinforcement) {
    expRec = 'Protect the funnel — maintain DSP for audiences with Sponsored Ads coverage. Cutting DSP risks losing the conversion lift that dual exposure provides. Scale TOF selectively to expand the dual-channel audience pool.';
  } else if (dspOnly && dspOnly.convRate < 0.3) {
    expRec = 'DSP-only conversion is low, but that is expected for an assist channel. Evaluate DSP on branded search lift, PDP engagement, and conversion probability when paired with Sponsored Ads — not standalone ROAS.';
  } else {
    expRec = 'Build sufficient DSP and Sponsored Ads audience overlap to test dual-channel reinforcement. Track exposure-group conversion rates bi-weekly to identify when the signal becomes definitive.';
  }

  base.insights.push({
    headline: hasMeaningfulReinforcement
      ? 'Dual exposure is reinforcing intent, not just overlapping audiences.'
      : 'Exposure group comparison completed — monitoring for definitive reinforcement signals.',
    observations,
    soWhat: hasMeaningfulReinforcement
      ? 'Users exposed across both channels convert at materially higher rates. This is not accidental overlap — it is reinforcement. DSP builds consideration, Sponsored Ads captures intent, and the combined effect exceeds what either channel delivers alone. Frame DSP budget as conversion lift, not duplicated cost.'
      : 'Separate assist behavior from last-touch performance to properly attribute upper-funnel value. DSP may appear inefficient on direct ROAS while materially improving downstream conversion when paired with Sponsored Ads.',
    recommendation: expRec,
  });

  return base;
}

/* ═══════════════════════════════════════════════
   Funnel-Mapped Recommendations Engine
   ═══════════════════════════════════════════════ */

export interface DeterministicRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export function computeRecommendations(
  analyses: SectionAnalysis[],
  dspData: Record<string, string>[] | null,
  dspHeaders: string[] | null,
  saData: Record<string, string>[] | null,
  saHeaders: string[] | null,
  campaignMappings: CampaignMapping[]
): DeterministicRecommendation[] {
  const recs: DeterministicRecommendation[] = [];

  // Refresh creative
  if (dspData && dspHeaders) {
    const ctrCol = findCol(dspHeaders, ['ctr', 'click_through_rate']);
    const spendCol = findCol(dspHeaders, ['spend', 'cost']);
    if (ctrCol) {
      const avgCTR = dspData.reduce((a, r) => a + num(r[ctrCol]), 0) / dspData.length;
      if (avgCTR < 0.1) {
        const totalSpend = spendCol ? dspData.reduce((a, r) => a + num(r[spendCol]), 0) : 0;
        recs.push({
          title: 'Refresh Creative',
          description: `DSP CTR is ${avgCTR.toFixed(3)}%${totalSpend > 0 ? ` across $${fmtNum(totalSpend)} in spend` : ''}. The creative is not earning attention. Test new assets, tighten audience targeting, or explore alternative supply sources.`,
          priority: 'high',
        });
      }
    }
  }

  // Strengthen retargeting capture (SA ACOS)
  if (saData && saHeaders) {
    const acosCol = findCol(saHeaders, ['acos']);
    if (acosCol) {
      const avgACOS = saData.reduce((a, r) => a + num(r[acosCol]), 0) / saData.length;
      if (avgACOS > 35) {
        recs.push({
          title: 'Tighten Sponsored Ads Efficiency',
          description: `ACOS sits at ${avgACOS.toFixed(1)}%. Audit high-spend, low-conversion keywords. Add negatives aggressively and review bid strategy by placement to improve capture efficiency.`,
          priority: 'high',
        });
      }
    }
  }

  // Tighten frequency cap
  const freqAnalysis = analyses.find(a => a.sectionId === 'frequency-analysis');
  if (freqAnalysis?.available && freqAnalysis.insights[0]) {
    const hasWaste = freqAnalysis.insights[0].observations.some(o => o.includes('waste band') || o.includes('waste'));
    const hasSaturation = freqAnalysis.insights[0].observations.some(o => o.includes('saturation') || o.includes('diminish'));
    if (hasWaste || hasSaturation) {
      recs.push({
        title: 'Tighten Frequency Cap',
        description: freqAnalysis.insights[0].recommendation,
        priority: 'high',
      });
    }
  }

  // Shift budget to fresh audiences
  const reachAnalysis = analyses.find(a => a.sectionId === 'reach-analysis');
  if (reachAnalysis?.available) {
    const weakCapture = reachAnalysis.insights[0]?.observations.some(o => o.includes('downstream capture') || o.includes('weak'));
    if (weakCapture) {
      recs.push({
        title: 'Strengthen Mid-Funnel Capture',
        description: 'Prospecting is expanding reach, but newly reached users are not converting. Add retargeting sequences before scaling further top-of-funnel spend — fix the middle before widening the top.',
        priority: 'high',
      });
    }
    const hasStrongEfficiency = reachAnalysis.insights[0]?.observations.some(o => o.includes('above-average efficiency') || o.includes('converting net-new'));
    if (hasStrongEfficiency) {
      recs.push({
        title: 'Scale TOF Selectively',
        description: 'Net-new reach is converting efficiently in specific campaign groups. Increase investment where the data supports it — selectively, not uniformly.',
        priority: 'medium',
      });
    }
  }

  // Protect the funnel
  const exposureAnalysis = analyses.find(a => a.sectionId === 'exposure-group-analysis');
  if (exposureAnalysis?.available) {
    const hasReinforcement = exposureAnalysis.insights[0]?.observations.some(o =>
      o.includes('reinforcing intent') || o.includes('outperforms mid-funnel') || o.includes('meaningful')
    );
    if (hasReinforcement) {
      recs.push({
        title: 'Protect the Funnel',
        description: 'Dual-channel users convert at materially higher rates. Cutting DSP to improve short-term ROAS risks losing the reinforcement lift that drives downstream conversion.',
        priority: 'high',
      });
    }
  }

  // Strengthen retargeting
  const convAnalysis = analyses.find(a => a.sectionId === 'converters-analysis');
  if (convAnalysis?.available) {
    const hasUnderExposure = convAnalysis.insights[0]?.observations.some(o => o.includes('barely entered') || o.includes('under-exposed') || o.includes('Low-exposure'));
    if (hasUnderExposure) {
      recs.push({
        title: 'Deepen Retargeting for Low-Exposure Users',
        description: 'Non-converters show minimal ad exposure and shallow PDP engagement. These users need more touches — broaden mid-funnel frequency to move them from awareness into genuine consideration.',
        priority: 'medium',
      });
    }
    const hasLongPurchase = convAnalysis.insights[0]?.observations.some(o => o.includes('days to purchase') || o.includes('considered purchase'));
    if (hasLongPurchase) {
      recs.push({
        title: 'Adopt Assisted-Performance Evaluation',
        description: 'The purchase cycle is long enough that direct attribution undervalues upper-funnel contribution. Evaluate DSP on branded search lift, DPV rate, and consideration depth.',
        priority: 'medium',
      });
    }
  }

  // Review trends
  if (exposureAnalysis?.available && !exposureAnalysis.insights[0]?.observations.some(o => o.includes('reinforcing') || o.includes('outperforms'))) {
    recs.push({
      title: 'Track Exposure-Group Trends',
      description: 'Dual-channel signals are directional but not yet definitive. Track exposure-group conversion rates bi-weekly — when the pattern becomes clear, act on it.',
      priority: 'low',
    });
  }

  // Fallback
  if (recs.length === 0) {
    recs.push({
      title: 'Continue Monitoring',
      description: 'Current metrics fall within normal ranges. Monitor bi-weekly and compare across reporting periods to surface actionable patterns.',
      priority: 'low',
    });
  }

  return recs.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
}
