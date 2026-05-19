/**
 * Dataset Specification Layer
 *
 * Defines required/optional columns for each upload type.
 * Used by the upload validator to confirm file structure.
 */

import { normalizeColumnName } from './csv-parser';

/* ── Column Spec ── */

export interface ColumnSpec {
  canonical: string;
  /** Normalized patterns that match this column (case-insensitive, underscored) */
  aliases: string[];
  required: boolean;
}

export interface DatasetSpec {
  slotId: string;
  label: string;
  columns: ColumnSpec[];
  /** For AMC Purchase Path: recognized key_metric values */
  recognizedValues?: Record<string, string[]>;
}

/* ── Specs ── */

export const DATASET_SPECS: DatasetSpec[] = [
  {
    slotId: 'amc-converters',
    label: 'AMC – Converters vs Non-Converters',
    columns: [
      { canonical: 'key_metric', aliases: ['key_metric', 'metric', 'kpi', 'metric_name', 'keymetric'], required: true },
      { canonical: 'customer_type', aliases: ['customer_type', 'segment', 'purchase', 'converter', 'purchase_flag', 'group', 'customertype', 'customer_segment'], required: true },
      { canonical: 'stats', aliases: ['stats', 'value', 'stat', 'metric_value', 'metricvalue'], required: true },
      { canonical: 'campaign_group', aliases: ['campaign_group', 'campaign', 'campaigngroup'], required: false },
      { canonical: 'ad_product_type', aliases: ['ad_product_type', 'ad_product', 'product_type', 'adproducttype'], required: false },
    ],
    recognizedValues: {
      key_metric: [
        'days_to_purchase_per_user',
        'ad_products_exposed_per_user',
        'total_impressions_per_user',
        'impressions_per_user_per_ad_product',
        'dpvs_per_user',
        'products_viewed_per_user',
      ],
    },
  },
  {
    slotId: 'amc-reach',
    label: 'AMC – Net-New Reach',
    columns: [
      { canonical: 'campaign_group', aliases: ['campaign_group', 'campaign', 'group', 'campaigngroup'], required: true },
      { canonical: 'net_new_reach', aliases: ['net_new_reach', 'new_reach', 'netnewreach'], required: true },
      { canonical: 'net_new_impressions', aliases: ['net_new_impressions', 'netnewimpressions'], required: true },
      { canonical: 'total_impressions', aliases: ['total_impressions', 'totalimpressions'], required: true },
      { canonical: 'net_new_clicks', aliases: ['net_new_clicks', 'netnewclicks'], required: false },
      { canonical: 'net_new_sales', aliases: ['net_new_sales', 'netnewsales'], required: false },
      { canonical: 'net_new_users_who_clicked', aliases: ['net_new_users_who_clicked', 'net_new_clickers', 'netnewuserswhoclicked'], required: false },
      { canonical: 'net_new_users_who_purchased', aliases: ['net_new_users_who_purchased', 'net_new_purchasers', 'netnewuserswhopurchased'], required: false },
      { canonical: 'total_reach', aliases: ['total_reach', 'total_users', 'totalreach'], required: false },
    ],
  },
  {
    slotId: 'amc-frequency',
    label: 'AMC – Optimal Frequency',
    columns: [
      { canonical: 'frequency_bucket', aliases: ['frequency_bucket', 'frequency', 'freq', 'freq_bucket', 'frequencybucket', 'exposure_bucket', 'exposurebucket'], required: true },
      { canonical: 'reach', aliases: ['reach', 'users'], required: true },
      { canonical: 'impressions', aliases: ['impressions', 'impression', 'imps'], required: true },
      { canonical: 'cost', aliases: ['cost', 'spend'], required: false },
      { canonical: 'clicks', aliases: ['clicks', 'click'], required: false },
      { canonical: 'click_through_rate', aliases: ['click_through_rate', 'ctr', 'clickthroughrate', 'click_rate'], required: false },
      { canonical: 'branded_searches', aliases: ['branded_searches', 'branded_search', 'brandedsearches'], required: false },
      { canonical: 'branded_search_rate', aliases: ['branded_search_rate', 'brandedsearchrate'], required: false },
      { canonical: 'detail_page_views', aliases: ['detail_page_views', 'dpv', 'dpvs', 'detailpageviews'], required: false },
      { canonical: 'detail_page_view_rate', aliases: ['detail_page_view_rate', 'dpvr', 'dpv_rate', 'detailpageviewrate'], required: false },
      { canonical: 'add_to_cart', aliases: ['add_to_cart', 'atc', 'addtocart'], required: false },
      { canonical: 'purchase_rate', aliases: ['purchase_rate', 'conversion_rate', 'purchaserate', 'conversionrate'], required: false },
      { canonical: 'purchases', aliases: ['purchases', 'purchase'], required: false },
      { canonical: 'new_to_brand_purchase_rate', aliases: ['new_to_brand_purchase_rate', 'ntb_purchase_rate', 'newtobrandpurchaserate'], required: false },
    ],
  },
  {
    slotId: 'amc-interaction',
    label: 'AMC – DSP + Sponsored Interaction',
    columns: [
      { canonical: 'exposure_group', aliases: ['exposure_group', 'group', 'segment', 'channel_group', 'exposuregroup'], required: true },
      { canonical: 'users_exposed', aliases: ['users_exposed', 'users', 'reach', 'exposed_users', 'usersexposed'], required: true },
      { canonical: 'purchasers', aliases: ['purchasers', 'converters', 'buyers'], required: true },
      { canonical: 'conversion_rate', aliases: ['conversion_rate', 'cvr', 'purchase_rate', 'conversionrate'], required: false },
      { canonical: 'impressions_per_user', aliases: ['impressions_per_user', 'avg_impressions', 'impressionsperuser'], required: false },
      { canonical: 'dpvs_per_user', aliases: ['dpvs_per_user', 'dpv_per_user', 'dpvsperuser'], required: false },
      { canonical: 'branded_searches_per_user', aliases: ['branded_searches_per_user', 'branded_search_per_user', 'brandedsearchesperuser'], required: false },
      { canonical: 'sales', aliases: ['sales', 'revenue'], required: false },
      { canonical: 'days_to_purchase', aliases: ['days_to_purchase', 'avg_days_to_purchase', 'daystopurchase'], required: false },
    ],
  },
  {
    slotId: 'dsp',
    label: 'DSP Campaign Performance',
    columns: [
      { canonical: 'campaign_name', aliases: ['campaign_name', 'campaign', 'name', 'campaignname', 'order_name', 'ordername'], required: true },
      { canonical: 'campaign_id', aliases: ['campaign_id', 'id', 'order_id', 'campaignid', 'orderid'], required: true },
      { canonical: 'spend', aliases: ['spend', 'cost', 'total_cost', 'total_spend', 'totalcost', 'totalspend'], required: true },
      { canonical: 'impressions', aliases: ['impressions', 'impression', 'imps'], required: true },
      { canonical: 'clicks', aliases: ['clicks', 'click'], required: true },
      { canonical: 'ctr', aliases: ['ctr', 'click_through_rate', 'clickthroughrate', 'click_rate'], required: false },
      { canonical: 'detail_page_view_rate', aliases: ['detail_page_view_rate', 'dpvr', 'dpv_rate', 'detailpageviewrate'], required: false },
      { canonical: 'purchases', aliases: ['purchases', 'purchase', 'total_purchases', 'totalpurchases'], required: false },
      { canonical: 'sales', aliases: ['sales', 'revenue', 'total_sales', 'totalsales'], required: false },
    ],
  },
  {
    slotId: 'sponsored-ads',
    label: 'Sponsored Ads Performance',
    columns: [
      { canonical: 'campaign_name', aliases: ['campaign_name', 'campaign', 'name', 'campaignname'], required: true },
      { canonical: 'campaign_id', aliases: ['campaign_id', 'id', 'campaignid'], required: true },
      { canonical: 'ad_type', aliases: ['ad_type', 'ad_format', 'type', 'targeting_type', 'adtype', 'adformat', 'targetingtype'], required: true },
      { canonical: 'spend', aliases: ['spend', 'cost', 'total_spend', 'totalspend'], required: true },
      { canonical: 'impressions', aliases: ['impressions', 'impression', 'imps'], required: true },
      { canonical: 'clicks', aliases: ['clicks', 'click'], required: true },
      { canonical: 'ctr', aliases: ['ctr', 'click_through_rate', 'clickthroughrate'], required: false },
      { canonical: 'purchases', aliases: ['purchases', 'purchase', 'orders'], required: false },
      { canonical: 'sales', aliases: ['sales', 'revenue', 'total_sales', 'totalsales'], required: false },
    ],
  },
  {
    slotId: 'campaign-mapping',
    label: 'Campaign Mapping Table',
    columns: [
      { canonical: 'campaign_id', aliases: ['campaign_id', 'id', 'campaignid'], required: true },
      { canonical: 'label', aliases: ['label', 'funnel_stage', 'stage', 'tactic', 'funnel', 'campaign_label', 'campaignlabel', 'funnelstage'], required: true },
      { canonical: 'campaign_name', aliases: ['campaign_name', 'campaign', 'name', 'campaignname'], required: false },
    ],
    recognizedValues: {
      label: ['TOF', 'MOF', 'BOF', 'Sponsored'],
    },
  },
];

/* ── Validation ── */

export interface ValidationResult {
  valid: boolean;
  matched: Record<string, string>;   // canonical → actual header
  missing: string[];                   // canonical names of missing required cols
  warnings: string[];
}

/**
 * Validate uploaded CSV headers against a dataset spec.
 * Tolerant of case differences and friendly header variants.
 */
export function validateHeaders(
  slotId: string,
  uploadedHeaders: string[]
): ValidationResult {
  const spec = DATASET_SPECS.find(s => s.slotId === slotId);
  if (!spec) return { valid: true, matched: {}, missing: [], warnings: [] };

  const normalizedUploaded = uploadedHeaders.map(h => ({
    original: h,
    normalized: normalizeColumnName(h),
  }));

  const matched: Record<string, string> = {};
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const col of spec.columns) {
    const found = normalizedUploaded.find(u =>
      col.aliases.some(alias => u.normalized.includes(alias))
    );

    if (found) {
      matched[col.canonical] = found.original;
    } else if (col.required) {
      missing.push(col.canonical);
    }
  }

  if (missing.length > 0) {
    warnings.push(
      `Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. The file may not be the correct export.`
    );
  }

  // Check recognized values if applicable
  if (spec.recognizedValues) {
    for (const [field, expectedValues] of Object.entries(spec.recognizedValues)) {
      const actualHeader = matched[field];
      if (!actualHeader) continue;
      // We can't check row values here (header-only validation).
      // Row-level value checks happen at analysis time.
    }
  }

  return {
    valid: missing.length === 0,
    matched,
    missing,
    warnings,
  };
}

/**
 * Get the spec for a given slot ID.
 */
export function getDatasetSpec(slotId: string): DatasetSpec | undefined {
  return DATASET_SPECS.find(s => s.slotId === slotId);
}
