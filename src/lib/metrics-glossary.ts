/**
 * Metrics Glossary & Interpretation Module
 *
 * Central source of truth for metric definitions, column patterns,
 * interpretation thresholds, and funnel-stage labels.
 * Used by report-engine, interaction-engine, and the glossary UI.
 */

/* ── Thresholds ── */

export const THRESHOLDS = {
  MATERIALLY_HIGHER: 15,   // percent
  MEANINGFULLY_HIGHER: 25, // percent
  DSP_CTR_LOW: 0.1,        // percent
  SA_ACOS_HIGH: 35,        // percent
} as const;

export function thresholdLabel(pctDiff: number): string {
  if (pctDiff >= THRESHOLDS.MEANINGFULLY_HIGHER) return 'meaningfully higher';
  if (pctDiff >= THRESHOLDS.MATERIALLY_HIGHER) return 'materially higher';
  if (pctDiff > 0) return 'slightly higher';
  return 'comparable or lower';
}

/* ── Funnel Stage Labels ── */

export type FunnelStage = 'TOF' | 'MOF' | 'BOF' | 'Sponsored';

export interface FunnelStageDefinition {
  key: FunnelStage;
  label: string;
  description: string;
  matchPatterns: string[];
}

export const FUNNEL_STAGES: FunnelStageDefinition[] = [
  {
    key: 'TOF',
    label: 'Top of Funnel',
    description: 'Prospecting / discovery / new user acquisition',
    matchPatterns: ['tof', 'awareness', 'upper', 'prospecting', 'discovery'],
  },
  {
    key: 'MOF',
    label: 'Mid Funnel',
    description: 'Retargeting / education / consideration',
    matchPatterns: ['mof', 'consideration', 'mid', 'retargeting', 'education'],
  },
  {
    key: 'BOF',
    label: 'Bottom of Funnel',
    description: 'High-intent conversion',
    matchPatterns: ['bof', 'conversion', 'lower', 'retargeting'],
  },
  {
    key: 'Sponsored',
    label: 'Sponsored Ads',
    description: 'Capture / intent harvesting / branded defense or non-brand capture',
    matchPatterns: ['sponsored', 'sp', 'sb', 'sd'],
  },
];

export function matchFunnelStage(value: string): FunnelStageDefinition | null {
  const v = value.toLowerCase();
  for (const stage of FUNNEL_STAGES) {
    if (stage.matchPatterns.some(p => v.includes(p))) return stage;
  }
  return null;
}

/* ── Exposure Groups ── */

export interface ExposureGroupDefinition {
  key: string;
  label: string;
  description: string;
}

export const EXPOSURE_GROUPS: ExposureGroupDefinition[] = [
  {
    key: 'dsp_only',
    label: 'DSP Only',
    description: 'Users exposed exclusively to DSP campaigns.',
  },
  {
    key: 'sponsored_only',
    label: 'Sponsored Only',
    description: 'Users exposed exclusively to Sponsored Ads campaigns.',
  },
  {
    key: 'dsp_sponsored',
    label: 'DSP + Sponsored',
    description: 'Users exposed to both DSP and Sponsored Ads. Often converts at a higher rate — framed as reinforcement, not duplication.',
  },
  {
    key: 'tof_mof_sponsored',
    label: 'TOF + MOF + Sponsored',
    description: 'Users exposed across the full funnel when campaign mapping is available.',
  },
];

export const EXPOSURE_INTERPRETATION =
  'Users exposed to both DSP and Sponsored Ads often convert at a higher rate than single-channel exposure groups. This should be framed as reinforcement, not duplication.';

/* ── Metric Definitions ── */

export interface MetricDefinition {
  id: string;
  label: string;
  description: string;
  columnPatterns: string[];
  category: 'purchase_path' | 'frequency' | 'net_new_reach' | 'dsp' | 'sponsored_ads' | 'interaction';
  interpretationRules: string[];
}

export const METRICS: MetricDefinition[] = [
  /* ── Purchase Path / Converters vs Non-Converters ── */
  {
    id: 'customer_type',
    label: 'Customer Type (Segment)',
    description: 'Segments data into Purchase vs No Purchase groups.',
    columnPatterns: ['purchase', 'converter', 'segment', 'group', 'purchase_flag', 'customer_type'],
    category: 'purchase_path',
    interpretationRules: [],
  },
  {
    id: 'days_to_purchase',
    label: 'Days to Purchase per User',
    description: 'Average number of days from first exposure to purchase.',
    columnPatterns: ['days_to_purchase_per_user', 'days_to_purchase', 'avg_days_to_purchase'],
    category: 'purchase_path',
    interpretationRules: [
      'If converters take longer to purchase, evaluate upper-funnel activity on assist metrics, not only direct ROAS.',
      'Longer purchase cycles suggest DSP may be assisting discovery and consideration before Sponsored captures demand.',
    ],
  },
  {
    id: 'ad_products_exposed',
    label: 'Ad Products Exposed per User',
    description: 'Number of distinct ad products a user was exposed to.',
    columnPatterns: ['ad_products_exposed_per_user', 'ad_products_exposed', 'ad_product'],
    category: 'purchase_path',
    interpretationRules: [
      'Higher ad product exposure among converters suggests multi-touch paths matter.',
      'Broader cross-touchpoint exposure is associated with stronger conversion readiness.',
    ],
  },
  {
    id: 'total_impressions_per_user',
    label: 'Total Impressions per User',
    description: 'Average total impressions delivered to each user.',
    columnPatterns: ['total_impressions_per_user', 'impressions_per_user', 'avg_impressions'],
    category: 'purchase_path',
    interpretationRules: [
      'Higher impression depth among converters supports repeated exposure strategy.',
    ],
  },
  {
    id: 'impressions_per_user_per_ad_product',
    label: 'Impressions per User per Ad Product',
    description: 'Average impressions per user broken down by ad product.',
    columnPatterns: ['impressions_per_user_per_ad_product', 'imp_per_user_per_product'],
    category: 'purchase_path',
    interpretationRules: [
      'Indicates frequency depth per product — useful for identifying whether specific products require more or fewer touches.',
    ],
  },
  {
    id: 'dpvs_per_user',
    label: 'Detail Page Views per User',
    description: 'Average number of product detail page views per user.',
    columnPatterns: ['dpvs_per_user', 'detail_page_views_per_user', 'dpv_per_user'],
    category: 'purchase_path',
    interpretationRules: [
      'Higher DPVs among converters suggests PDP engagement is a key assist behavior.',
      'Deeper PDP engagement is part of the conversion path.',
    ],
  },
  {
    id: 'products_viewed_per_user',
    label: 'Products Viewed per User',
    description: 'Average number of distinct products viewed per user.',
    columnPatterns: ['products_viewed_per_user', 'products_viewed'],
    category: 'purchase_path',
    interpretationRules: [
      'Higher products viewed among converters infers stronger product consideration before conversion.',
      'If non-converters show low exposure and low DPVs, the issue may be under-exposure or weak retargeting.',
    ],
  },

  /* ── Optimal Frequency ── */
  {
    id: 'frequency_bucket',
    label: 'Frequency Bucket',
    description: 'Number of times a user was exposed. Usually buckets run from 1 to 25+.',
    columnPatterns: ['frequency_bucket', 'frequency', 'freq'],
    category: 'frequency',
    interpretationRules: [],
  },
  {
    id: 'reach',
    label: 'Reach',
    description: 'Number of unique users reached at each frequency bucket.',
    columnPatterns: ['reach'],
    category: 'frequency',
    interpretationRules: [],
  },
  {
    id: 'purchase_rate',
    label: 'Purchase Rate',
    description: 'Percentage of users who purchased at each frequency bucket.',
    columnPatterns: ['purchase_rate', 'purchases', 'purchase', 'conversion_rate'],
    category: 'frequency',
    interpretationRules: [
      'Identify where purchase rate peaks.',
      'If purchase rate flattens after a certain bucket, that indicates saturation.',
      'Recommend a cap range and call out waste bands.',
    ],
  },
  {
    id: 'branded_search_rate',
    label: 'Branded Search Rate',
    description: 'Rate of branded searches at each frequency bucket.',
    columnPatterns: ['branded_search_rate', 'branded_searches', 'branded_search'],
    category: 'frequency',
    interpretationRules: [
      'If branded search rate flattens after a threshold, that indicates awareness saturation.',
    ],
  },
  {
    id: 'detail_page_view_rate',
    label: 'Detail Page View Rate',
    description: 'Rate of detail page views at each frequency bucket.',
    columnPatterns: ['detail_page_view_rate', 'detail_page_views', 'dpvr'],
    category: 'frequency',
    interpretationRules: [
      'If DPV rate flattens after a threshold, that indicates engagement saturation.',
    ],
  },
  {
    id: 'add_to_cart',
    label: 'Add to Cart',
    description: 'Number or rate of add-to-cart actions at each frequency bucket.',
    columnPatterns: ['add_to_cart', 'atc', 'add_to_cart_rate'],
    category: 'frequency',
    interpretationRules: [],
  },

  /* ── Net-New Reach ── */
  {
    id: 'net_new_reach',
    label: 'Net-New Reach',
    description: 'Users reached who had not viewed brand PDPs in prior months.',
    columnPatterns: ['net_new_reach', 'net_new_users', 'new_to_brand_reach'],
    category: 'net_new_reach',
    interpretationRules: [
      'High net-new reach with strong purchase efficiency supports TOF investment.',
      'High net-new reach with weak purchase efficiency suggests awareness is happening but mid-funnel capture needs improvement.',
    ],
  },
  {
    id: 'net_new_impressions',
    label: 'Net-New Impressions',
    description: 'Impressions served to net-new users.',
    columnPatterns: ['net_new_impressions'],
    category: 'net_new_reach',
    interpretationRules: [],
  },
  {
    id: 'net_new_clicks',
    label: 'Net-New Clicks',
    description: 'Clicks from net-new users.',
    columnPatterns: ['net_new_clicks'],
    category: 'net_new_reach',
    interpretationRules: [],
  },
  {
    id: 'net_new_sales',
    label: 'Net-New Sales',
    description: 'Sales attributed to net-new users.',
    columnPatterns: ['net_new_sales'],
    category: 'net_new_reach',
    interpretationRules: [],
  },
  {
    id: 'net_new_users_clicked',
    label: 'Net-New Users Who Clicked',
    description: 'Count of net-new users who clicked an ad.',
    columnPatterns: ['net_new_users_who_clicked', 'net_new_clickers'],
    category: 'net_new_reach',
    interpretationRules: [],
  },
  {
    id: 'net_new_users_purchased',
    label: 'Net-New Users Who Purchased',
    description: 'Count of net-new users who completed a purchase.',
    columnPatterns: ['net_new_users_who_purchased', 'net_new_purchasers'],
    category: 'net_new_reach',
    interpretationRules: [
      'Distinguish prospecting value from retargeting value.',
    ],
  },
  {
    id: 'total_reach',
    label: 'Total Reach',
    description: 'Total unique users reached.',
    columnPatterns: ['total_reach', 'total_users'],
    category: 'net_new_reach',
    interpretationRules: [],
  },
  {
    id: 'total_impressions',
    label: 'Total Impressions',
    description: 'Total impressions served.',
    columnPatterns: ['total_impressions'],
    category: 'net_new_reach',
    interpretationRules: [],
  },

  /* ── DSP ── */
  {
    id: 'dsp_spend',
    label: 'DSP Spend',
    description: 'Total spend on DSP campaigns.',
    columnPatterns: ['spend', 'total_cost', 'cost'],
    category: 'dsp',
    interpretationRules: [],
  },
  {
    id: 'dsp_impressions',
    label: 'DSP Impressions',
    description: 'Total impressions from DSP campaigns.',
    columnPatterns: ['impression', 'impressions'],
    category: 'dsp',
    interpretationRules: [],
  },
  {
    id: 'dsp_clicks',
    label: 'DSP Clicks',
    description: 'Total clicks from DSP campaigns.',
    columnPatterns: ['click', 'clicks'],
    category: 'dsp',
    interpretationRules: [],
  },
  {
    id: 'dsp_dpvr',
    label: 'Detail Page View Rate',
    description: 'Rate of detail page views driven by DSP campaigns.',
    columnPatterns: ['dpvr', 'detail_page_view_rate'],
    category: 'dsp',
    interpretationRules: [],
  },

  /* ── Sponsored Ads ── */
  {
    id: 'sa_spend',
    label: 'SA Spend',
    description: 'Total spend on Sponsored Ads campaigns.',
    columnPatterns: ['spend', 'cost'],
    category: 'sponsored_ads',
    interpretationRules: [],
  },
  {
    id: 'sa_acos',
    label: 'ACOS',
    description: 'Advertising Cost of Sales for Sponsored Ads.',
    columnPatterns: ['acos'],
    category: 'sponsored_ads',
    interpretationRules: [],
  },
];

/* ── Lookup helpers ── */

export function getMetric(id: string): MetricDefinition | undefined {
  return METRICS.find(m => m.id === id);
}

export function getMetricsByCategory(category: MetricDefinition['category']): MetricDefinition[] {
  return METRICS.filter(m => m.category === category);
}

export function getInterpretationRules(id: string): string[] {
  return getMetric(id)?.interpretationRules ?? [];
}

/* ── Glossary category labels for UI ── */

export interface GlossaryCategory {
  key: MetricDefinition['category'];
  title: string;
  subtitle: string;
}

export const GLOSSARY_CATEGORIES: GlossaryCategory[] = [
  {
    key: 'purchase_path',
    title: 'Converters vs Non-Converters Purchase Path',
    subtitle: 'Segmented by customer_type = Purchase vs No Purchase',
  },
  {
    key: 'frequency',
    title: 'Optimal Frequency',
    subtitle: 'Frequency buckets from 1 to 25+ exposures',
  },
  {
    key: 'net_new_reach',
    title: 'Net-New Reach',
    subtitle: 'Users reached who had not viewed brand PDPs previously',
  },
  {
    key: 'interaction',
    title: 'Exposure Group / Interaction Logic',
    subtitle: 'Cross-channel reinforcement analysis',
  },
  {
    key: 'dsp',
    title: 'DSP Campaign Performance',
    subtitle: 'Amazon DSP console metrics',
  },
  {
    key: 'sponsored_ads',
    title: 'Sponsored Ads Performance',
    subtitle: 'Sponsored Ads console metrics',
  },
];
