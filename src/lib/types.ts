export interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  annualRevenue: string;
  howDidYouHear: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface UploadSlot {
  id: string;
  label: string;
  description: string;
  required: boolean;
  file: File | null;
  status: 'empty' | 'uploading' | 'valid' | 'error' | 'mapping';
  errorMessage?: string;
  showTroubleshooter?: boolean;
  data?: Record<string, unknown>[];
  columns?: string[];
  /** Ingestion result for column mapping UI */
  ingestion?: import('./ingestion-engine').IngestionResult;
  /** Final confirmed column mappings */
  confirmedMappings?: import('./ingestion-engine').ColumnMapping[];
  /** Whether dataset is partial (missing optional fields) */
  isPartial?: boolean;
  /** Canonical fields available after mapping */
  availableFields?: string[];
}

export interface ReportingWindow {
  startDate: string;
  endDate: string;
  isCustom: boolean;
}

export interface ExecutiveSummaryMetrics {
  dspSpend?: number;
  dspImpressions?: number;
  dspClicks?: number;
  dspCTR?: number;
  dspDPVR?: number;
  dspROAS?: number;
  saSpend?: number;
  saImpressions?: number;
  saClicks?: number;
  saCTR?: number;
  saACOS?: number;
  saROAS?: number;
  saSales?: number;
}

export interface ReportSection {
  id: string;
  title: string;
  available: boolean;
  missingDataset?: string;
}

export type AppStep = 'landing' | 'lead-capture' | 'onboarding' | 'upload' | 'report';
