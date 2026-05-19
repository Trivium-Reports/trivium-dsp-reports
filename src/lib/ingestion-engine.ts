/**
 * Ingestion Engine
 *
 * Auto-detects file types from CSV headers, maps columns to canonical names,
 * computes confidence scores, and normalizes data for downstream analysis.
 */

import { normalizeColumnName } from './csv-parser';
import { DATASET_SPECS, type DatasetSpec, type ColumnSpec } from './dataset-specs';

/* ── Types ── */

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

export interface ColumnMapping {
  canonical: string;
  label: string;
  required: boolean;
  mappedTo: string | null;       // actual header from CSV
  autoMapped: boolean;
  alternatives: string[];        // other CSV headers user could pick
}

export interface IngestionResult {
  detectedSlotId: string;
  detectedLabel: string;
  confidence: ConfidenceLevel;
  confidenceScore: number;       // 0-1
  columnMappings: ColumnMapping[];
  requiredMet: boolean;
  requiredTotal: number;
  requiredMapped: number;
  optionalTotal: number;
  optionalMapped: number;
  isPartial: boolean;            // all required met, but some optional missing
  isLongFormat: boolean;         // true if AMC semi-structured (metrics as rows)
  feedbackMessage: string;
  mismatch: boolean;             // true if detected type differs from target slot
  suggestedSlotId?: string;      // if mismatch, the better slot
  suggestedSlotLabel?: string;
}

export interface NormalizedDataset {
  slotId: string;
  canonicalRows: Record<string, string>[];
  mappings: Record<string, string>; // canonical → actual header
  availableFields: string[];        // canonical names that are present
  partial: boolean;
}

/* ── AMC row-value recognition ── */

/** Known key_metric values that identify specific AMC use cases */
const AMC_CONVERTER_METRICS = [
  'days_to_purchase', 'ad_products_exposed', 'total_impressions_per_user',
  'impressions_per_user_per_ad_product', 'dpvs_per_user', 'products_viewed_per_user',
];

const AMC_FREQUENCY_VALUES = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '1-2', '3-5', '6-10', '11-20', '11+', '20+',
];

const AMC_CUSTOMER_TYPES = [
  'purchase', 'no_purchase', 'no purchase', 'converter', 'non-converter', 'non_converter',
  'purchaser', 'non-purchaser', 'non_purchaser',
];

/**
 * Inspect row values to detect AMC semi-structured formats.
 * AMC exports often have metrics as rows (key_metric + stats) rather than columns.
 */
function scoreAmcRowValues(
  spec: DatasetSpec,
  mappings: Record<string, string>,
  rows: Record<string, string>[]
): number {
  if (!rows || rows.length === 0) return 0;
  const sampleRows = rows.slice(0, Math.min(rows.length, 50));
  let bonus = 0;

  if (spec.slotId === 'amc-converters') {
    // Check for known key_metric values in rows
    const kmHeader = mappings['key_metric'];
    const ctHeader = mappings['customer_type'];
    if (kmHeader) {
      const knownMetricHits = sampleRows.filter(r => {
        const val = normalizeColumnName(r[kmHeader] || '');
        return AMC_CONVERTER_METRICS.some(m => val.includes(m));
      });
      if (knownMetricHits.length > 0) bonus += 0.8;
    }
    if (ctHeader) {
      const knownTypeHits = sampleRows.filter(r => {
        const val = (r[ctHeader] || '').toLowerCase().trim();
        return AMC_CUSTOMER_TYPES.some(t => val.includes(t));
      });
      if (knownTypeHits.length > 0) bonus += 0.5;
    }
  }

  if (spec.slotId === 'amc-frequency') {
    const fbHeader = mappings['frequency_bucket'];
    if (fbHeader) {
      const knownFreqHits = sampleRows.filter(r => {
        const val = (r[fbHeader] || '').trim();
        return AMC_FREQUENCY_VALUES.some(f => val === f || val.startsWith(f + ' ') || val.startsWith(f + '-'));
      });
      if (knownFreqHits.length >= 2) bonus += 0.7;
    }
  }

  if (spec.slotId === 'amc-reach') {
    const cgHeader = mappings['campaign_group'];
    const nnrHeader = mappings['net_new_reach'];
    if (cgHeader && nnrHeader) {
      // If rows have campaign_group values and numeric net_new_reach, strong signal
      const validRows = sampleRows.filter(r =>
        (r[cgHeader] || '').trim().length > 0 && !isNaN(parseFloat(r[nnrHeader] || ''))
      );
      if (validRows.length >= 1) bonus += 0.6;
    }
  }

  if (spec.slotId === 'amc-interaction') {
    const egHeader = mappings['exposure_group'];
    if (egHeader) {
      const knownGroups = ['dsp only', 'sponsored only', 'both', 'dsp + sponsored', 'overlap', 'dsp_only', 'sp_only'];
      const hits = sampleRows.filter(r => {
        const val = (r[egHeader] || '').toLowerCase().trim();
        return knownGroups.some(g => val.includes(g));
      });
      if (hits.length >= 1) bonus += 0.7;
    }
  }

  return bonus;
}

/**
 * Detect if a file is a "long-format" AMC use case output
 * (few columns, metrics as row values) vs a "wide" tabular export.
 */
function isLongFormatAmc(headers: string[], rows: Record<string, string>[]): boolean {
  // Long-format AMC: typically 3-6 columns, many rows with repeated metric names
  if (headers.length > 8) return false;
  const normalizedHeaders = headers.map(h => normalizeColumnName(h));
  const hasKeyMetric = normalizedHeaders.some(h =>
    ['key_metric', 'metric', 'kpi', 'metric_name'].some(p => h.includes(p))
  );
  const hasStats = normalizedHeaders.some(h =>
    ['stats', 'value', 'stat', 'metric_value'].some(p => h.includes(p))
  );
  return hasKeyMetric && hasStats;
}

/* ── Detection ── */

/**
 * Score how well a set of headers matches a dataset spec.
 */
function scoreSpecMatch(
  spec: DatasetSpec,
  normalizedHeaders: { original: string; normalized: string }[],
  rows?: Record<string, string>[]
): { score: number; mappings: Record<string, string>; requiredMet: number; requiredTotal: number; isLongFormat: boolean } {
  let requiredMatched = 0;
  let optionalMatched = 0;
  const mappings: Record<string, string> = {};
  const usedHeaders = new Set<string>();

  const requiredCols = spec.columns.filter(c => c.required);
  const optionalCols = spec.columns.filter(c => !c.required);

  // Match required columns first
  for (const col of requiredCols) {
    const found = findBestMatch(col, normalizedHeaders, usedHeaders);
    if (found) {
      mappings[col.canonical] = found.original;
      usedHeaders.add(found.original);
      requiredMatched++;
    }
  }

  // Then optional
  for (const col of optionalCols) {
    const found = findBestMatch(col, normalizedHeaders, usedHeaders);
    if (found) {
      mappings[col.canonical] = found.original;
      usedHeaders.add(found.original);
      optionalMatched++;
    }
  }

  // AMC row-value heuristics — inspect actual data for AMC slots
  let amcBonus = 0;
  const isAmcSlot = spec.slotId.startsWith('amc-');
  if (isAmcSlot && rows && rows.length > 0) {
    amcBonus = scoreAmcRowValues(spec, mappings, rows);
  }

  // For campaign-mapping, check if rows contain TOF/MOF/BOF/Sponsored values
  if (spec.slotId === 'campaign-mapping' && rows && rows.length > 0) {
    const labelHeader = mappings['label'];
    if (labelHeader) {
      const knownLabels = ['tof', 'mof', 'bof', 'sponsored'];
      const hasKnown = rows.some(r => {
        const val = (r[labelHeader] || '').toLowerCase().trim();
        return knownLabels.some(k => val.includes(k));
      });
      if (hasKnown) requiredMatched += 0.5;
    }
  }

  // Disambiguate DSP vs Sponsored Ads: if ad_type is present, it's SA
  if (spec.slotId === 'dsp' && mappings['ad_type']) {
    requiredMatched -= 1;
  }

  const totalCols = requiredCols.length + optionalCols.length;
  const headerScore = totalCols > 0
    ? ((requiredMatched * 2 + optionalMatched) / (requiredCols.length * 2 + optionalCols.length))
    : 0;

  // For AMC slots, blend header score with row-value bonus
  const score = isAmcSlot
    ? Math.min(1, headerScore * 0.6 + amcBonus * 0.4 + (amcBonus > 0 ? 0.1 : 0))
    : headerScore;

  const longFormat = isAmcSlot && rows ? isLongFormatAmc(
    normalizedHeaders.map(h => h.original),
    rows
  ) : false;

  return { score, mappings, requiredMet: Math.floor(requiredMatched), requiredTotal: requiredCols.length, isLongFormat: longFormat };
}

function findBestMatch(
  col: ColumnSpec,
  normalizedHeaders: { original: string; normalized: string }[],
  usedHeaders: Set<string>
): { original: string; normalized: string } | null {
  // Exact alias match first
  for (const alias of col.aliases) {
    const found = normalizedHeaders.find(
      h => !usedHeaders.has(h.original) && h.normalized === alias
    );
    if (found) return found;
  }
  // Partial alias match
  for (const alias of col.aliases) {
    const found = normalizedHeaders.find(
      h => !usedHeaders.has(h.original) && (h.normalized.includes(alias) || alias.includes(h.normalized))
    );
    if (found) return found;
  }
  return null;
}

/**
 * Detect which dataset spec best matches the given headers.
 */
export function detectFileType(
  headers: string[],
  rows?: Record<string, string>[]
): { slotId: string; label: string; confidence: ConfidenceLevel; score: number; mappings: Record<string, string>; isLongFormat: boolean }[] {
  const normalizedHeaders = headers.map(h => ({
    original: h,
    normalized: normalizeColumnName(h),
  }));

  const results = DATASET_SPECS.map(spec => {
    const { score, mappings, requiredMet, requiredTotal, isLongFormat } = scoreSpecMatch(spec, normalizedHeaders, rows);
    const allRequiredMet = requiredMet >= requiredTotal;
    let confidence: ConfidenceLevel;
    // AMC long-format files may have very few columns but strong row-value signals
    if (allRequiredMet && score >= 0.5) confidence = 'high';
    else if (allRequiredMet && score >= 0.25) confidence = 'medium';
    else if (requiredMet > 0) confidence = 'low';
    else confidence = 'none';

    return {
      slotId: spec.slotId,
      label: spec.label,
      confidence,
      score,
      mappings,
      isLongFormat,
    };
  });

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results;
}

/* ── Full Ingestion ── */

/**
 * Run full ingestion for a file uploaded to a specific slot.
 * Returns mapping info, confidence, feedback, and mismatch detection.
 */
export function ingestFile(
  targetSlotId: string,
  headers: string[],
  rows?: Record<string, string>[]
): IngestionResult {
  const normalizedHeaders = headers.map(h => ({
    original: h,
    normalized: normalizeColumnName(h),
  }));

  // Detect best match across all specs
  const detections = detectFileType(headers, rows);
  const bestMatch = detections[0];
  const targetMatch = detections.find(d => d.slotId === targetSlotId);

  // Determine if mismatch
  const isMismatch = bestMatch.slotId !== targetSlotId && bestMatch.confidence !== 'none' &&
    bestMatch.score > (targetMatch?.score || 0) + 0.15;

  const effectiveSlotId = isMismatch ? bestMatch.slotId : targetSlotId;
  const spec = DATASET_SPECS.find(s => s.slotId === effectiveSlotId);

  if (!spec) {
    return {
      detectedSlotId: targetSlotId,
      detectedLabel: 'Unknown',
      confidence: 'none',
      confidenceScore: 0,
      columnMappings: [],
      requiredMet: false,
      requiredTotal: 0,
      requiredMapped: 0,
      optionalTotal: 0,
      optionalMapped: 0,
      isPartial: false,
      isLongFormat: false,
      feedbackMessage: 'Could not determine file type.',
      mismatch: false,
    };
  }

  // Build detailed column mappings
  const usedHeaders = new Set<string>();
  const matchData = isMismatch ? bestMatch : (targetMatch || bestMatch);
  const columnMappings: ColumnMapping[] = spec.columns.map(col => {
    const mappedHeader = matchData.mappings[col.canonical] || null;
    if (mappedHeader) usedHeaders.add(mappedHeader);
    const alternatives = headers.filter(h => !usedHeaders.has(h) || h === mappedHeader);
    return {
      canonical: col.canonical,
      label: col.canonical.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      required: col.required,
      mappedTo: mappedHeader,
      autoMapped: !!mappedHeader,
      alternatives,
    };
  });

  // Refresh alternatives to include all unmapped headers
  const allMapped = new Set(columnMappings.filter(m => m.mappedTo).map(m => m.mappedTo!));
  const unmappedHeaders = headers.filter(h => !allMapped.has(h));
  for (const cm of columnMappings) {
    cm.alternatives = cm.mappedTo
      ? [cm.mappedTo, ...unmappedHeaders]
      : ['', ...unmappedHeaders];
  }

  const requiredMappings = columnMappings.filter(m => m.required);
  const optionalMappings = columnMappings.filter(m => !m.required);
  const requiredMapped = requiredMappings.filter(m => m.mappedTo).length;
  const optionalMapped = optionalMappings.filter(m => m.mappedTo).length;
  const requiredMet = requiredMapped === requiredMappings.length;
  const isPartial = requiredMet && optionalMapped < optionalMappings.length;

  // Build feedback message
  const formatNote = matchData.isLongFormat ? ' (long-format: metrics as rows)' : '';
  let feedbackMessage: string;
  if (isMismatch) {
    feedbackMessage = `This file looks more like a ${spec.label} export${formatNote}. Would you like to move it to the correct slot?`;
  } else if (!requiredMet) {
    const missing = requiredMappings.filter(m => !m.mappedTo).map(m => m.label);
    feedbackMessage = `Missing required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Please map them below.`;
  } else if (isPartial) {
    const totalMapped = requiredMapped + optionalMapped;
    const totalFields = requiredMappings.length + optionalMappings.length;
    feedbackMessage = `Mapped ${totalMapped} of ${totalFields} expected fields${formatNote}. File is usable — some optional fields were not found.`;
  } else {
    feedbackMessage = `All fields mapped successfully${formatNote}. Ready for analysis.`;
  }

  return {
    detectedSlotId: effectiveSlotId,
    detectedLabel: spec.label,
    confidence: matchData.confidence,
    confidenceScore: matchData.score,
    columnMappings,
    requiredMet,
    requiredTotal: requiredMappings.length,
    requiredMapped,
    optionalTotal: optionalMappings.length,
    optionalMapped,
    isPartial,
    isLongFormat: matchData.isLongFormat || false,
    feedbackMessage,
    mismatch: isMismatch,
    suggestedSlotId: isMismatch ? bestMatch.slotId : undefined,
    suggestedSlotLabel: isMismatch ? bestMatch.label : undefined,
  };
}

/* ── Normalization ── */

/**
 * Normalize row data from raw CSV headers to canonical field names
 * using the provided column mappings.
 */
export function normalizeRows(
  rows: Record<string, string>[],
  columnMappings: ColumnMapping[]
): Record<string, string>[] {
  const headerMap: Record<string, string> = {}; // actual → canonical
  for (const m of columnMappings) {
    if (m.mappedTo) {
      headerMap[m.mappedTo] = m.canonical;
    }
  }

  return rows.map(row => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const canonical = headerMap[key];
      if (canonical) {
        normalized[canonical] = value;
      }
      // Also keep original key for backward compat
      normalized[key] = value;
    }
    return normalized;
  });
}

/**
 * Get canonical field names that are available in a mapping set.
 */
export function getAvailableCanonicalFields(mappings: ColumnMapping[]): string[] {
  return mappings.filter(m => m.mappedTo).map(m => m.canonical);
}
