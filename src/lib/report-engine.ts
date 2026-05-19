import { normalizeColumnName } from './csv-parser';
import type { ExecutiveSummaryMetrics, ReportSection } from './types';

function findCol(headers: string[], patterns: string[]): string | null {
  for (const h of headers) {
    const n = normalizeColumnName(h);
    for (const p of patterns) {
      if (n.includes(p)) return h;
    }
  }
  return null;
}

function sumCol(rows: Record<string, string>[], col: string): number {
  return rows.reduce((acc, r) => acc + (parseFloat(r[col]?.replace(/[$,%]/g, '') || '0') || 0), 0);
}

function avgCol(rows: Record<string, string>[], col: string): number {
  const vals = rows.map(r => parseFloat(r[col]?.replace(/[$,%]/g, '') || '0')).filter(v => !isNaN(v));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

export function computeExecutiveSummary(
  dspData: Record<string, string>[] | null,
  dspHeaders: string[] | null,
  saData: Record<string, string>[] | null,
  saHeaders: string[] | null
): ExecutiveSummaryMetrics {
  const metrics: ExecutiveSummaryMetrics = {};

  if (dspData && dspHeaders) {
    const spendCol = findCol(dspHeaders, ['spend', 'total_cost', 'cost']);
    const impCol = findCol(dspHeaders, ['impression', 'impressions']);
    const clickCol = findCol(dspHeaders, ['click', 'clicks']);
    const dpvrCol = findCol(dspHeaders, ['dpvr', 'detail_page_view_rate']);
    const roasCol = findCol(dspHeaders, ['roas', 'return_on_ad_spend']);

    if (spendCol) metrics.dspSpend = sumCol(dspData, spendCol);
    if (impCol) metrics.dspImpressions = sumCol(dspData, impCol);
    if (clickCol) metrics.dspClicks = sumCol(dspData, clickCol);
    if (metrics.dspImpressions && metrics.dspClicks) {
      metrics.dspCTR = (metrics.dspClicks / metrics.dspImpressions) * 100;
    }
    if (dpvrCol) metrics.dspDPVR = avgCol(dspData, dpvrCol);
    if (roasCol) metrics.dspROAS = avgCol(dspData, roasCol);
  }

  if (saData && saHeaders) {
    const spendCol = findCol(saHeaders, ['spend', 'cost']);
    const impCol = findCol(saHeaders, ['impression', 'impressions']);
    const clickCol = findCol(saHeaders, ['click', 'clicks']);
    const acosCol = findCol(saHeaders, ['acos']);
    const roasCol = findCol(saHeaders, ['roas']);
    const salesCol = findCol(saHeaders, ['sales', 'revenue', 'total_sales']);

    if (spendCol) metrics.saSpend = sumCol(saData, spendCol);
    if (impCol) metrics.saImpressions = sumCol(saData, impCol);
    if (clickCol) metrics.saClicks = sumCol(saData, clickCol);
    if (metrics.saImpressions && metrics.saClicks) {
      metrics.saCTR = (metrics.saClicks / metrics.saImpressions) * 100;
    }
    if (acosCol) metrics.saACOS = avgCol(saData, acosCol);
    if (roasCol) metrics.saROAS = avgCol(saData, roasCol);
    if (salesCol) metrics.saSales = sumCol(saData, salesCol);
  }

  return metrics;
}

export function getAvailableSections(
  hasAmc: boolean,
  hasDsp: boolean,
  hasSa: boolean,
  amcHeaders?: string[]
): ReportSection[] {
  const hasConverters = hasAmc && amcHeaders?.some(h => {
    const n = normalizeColumnName(h);
    return n.includes('converter') || n.includes('purchase_path') || n.includes('non_converter');
  });

  const hasFrequency = hasAmc && amcHeaders?.some(h => {
    const n = normalizeColumnName(h);
    return n.includes('frequency') || n.includes('freq');
  });

  const hasReach = hasAmc && amcHeaders?.some(h => {
    const n = normalizeColumnName(h);
    return n.includes('new_to_brand') || n.includes('ntb') || n.includes('reach') || n.includes('net_new');
  });

  return [
    {
      id: 'executive-summary',
      title: 'Executive Summary',
      available: hasDsp || hasSa,
      missingDataset: !hasDsp && !hasSa ? 'DSP or Sponsored Ads export' : undefined,
    },
    {
      id: 'dsp-sa-interaction',
      title: 'DSP + Sponsored Ads Interaction Insights',
      available: hasDsp && hasSa,
      missingDataset: !hasDsp ? 'DSP export' : !hasSa ? 'Sponsored Ads export' : undefined,
    },
    {
      id: 'converters-analysis',
      title: 'Converters vs Non-Converters Purchase Path',
      available: !!hasConverters,
      missingDataset: !hasAmc ? 'AMC use case export' : 'AMC converter/purchase path data',
    },
    {
      id: 'frequency-analysis',
      title: 'Optimal Frequency Analysis',
      available: !!hasFrequency,
      missingDataset: !hasAmc ? 'AMC use case export' : 'AMC frequency data',
    },
    {
      id: 'reach-analysis',
      title: 'Net-New Reach Analysis',
      available: !!hasReach,
      missingDataset: !hasAmc ? 'AMC use case export' : 'AMC reach/NTB data',
    },
    {
      id: 'recommendations',
      title: 'Recommended Next Steps',
      available: hasDsp || hasSa || hasAmc,
      missingDataset: 'At least one dataset',
    },
  ];
}
