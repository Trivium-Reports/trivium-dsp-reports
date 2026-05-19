import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, ChevronDown, ArrowRight, Zap, Info, Eye, EyeOff } from "lucide-react";
import type { ColumnMapping, IngestionResult } from "@/lib/ingestion-engine";

interface ColumnMappingDialogProps {
  ingestion: IngestionResult;
  onConfirm: (updatedMappings: ColumnMapping[]) => void;
  onReassign?: (suggestedSlotId: string) => void;
  onCancel: () => void;
}

const confidenceBadge = (level: string) => {
  switch (level) {
    case 'high':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-display font-bold uppercase tracking-wide"><Zap className="w-3 h-3" /> High</span>;
    case 'medium':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-display font-bold uppercase tracking-wide">Medium</span>;
    case 'low':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-display font-bold uppercase tracking-wide">Low</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-display font-bold uppercase tracking-wide">Unknown</span>;
  }
};

const ColumnMappingDialog = ({ ingestion, onConfirm, onReassign, onCancel }: ColumnMappingDialogProps) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>(ingestion.columnMappings);
  const isHighConfidence = ingestion.confidence === 'high' && ingestion.requiredMet && !ingestion.mismatch;
  const [showDetails, setShowDetails] = useState(!isHighConfidence);

  const handleMappingChange = (canonical: string, newHeader: string) => {
    setMappings(prev =>
      prev.map(m =>
        m.canonical === canonical
          ? { ...m, mappedTo: newHeader || null, autoMapped: false }
          : m
      )
    );
  };

  const requiredMappings = mappings.filter(m => m.required);
  const optionalMappings = mappings.filter(m => !m.required);
  const allRequiredMapped = requiredMappings.every(m => m.mappedTo);
  const mappedCount = mappings.filter(m => m.mappedTo).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-card border border-border rounded-xl p-5 mt-3 shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-display font-bold text-sm">Review Mapped Fields</h4>
            {confidenceBadge(ingestion.confidence)}
          </div>
          <p className="text-xs font-body text-muted-foreground">
            Detected as: <span className="font-semibold text-foreground">{ingestion.detectedLabel}</span>
            <span className="ml-2 text-muted-foreground">
              — {mappedCount} of {mappings.length} fields mapped
            </span>
          </p>
        </div>
      </div>

      {/* Mismatch warning */}
      {ingestion.mismatch && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 mb-3">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-body text-destructive font-medium">
              {ingestion.feedbackMessage}
            </p>
            {onReassign && ingestion.suggestedSlotId && (
              <button
                onClick={() => onReassign(ingestion.suggestedSlotId!)}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-display font-bold uppercase tracking-wide hover:scale-105 transition-transform"
              >
                Move to {ingestion.suggestedSlotLabel}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* High-confidence compact summary */}
      {isHighConfidence && !showDetails && (
        <div className="space-y-2 mb-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-body text-foreground font-medium">
                All {requiredMappings.length} required fields mapped automatically.
                {ingestion.isPartial && ` ${optionalMappings.filter(m => !m.mappedTo).length} optional field(s) not found.`}
              </p>
              {/* Quick summary of mapped required fields */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {requiredMappings.filter(m => m.mappedTo).map(m => (
                  <span key={m.canonical} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs font-body">
                    <span className="text-muted-foreground">{m.mappedTo}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{m.label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(true)}
            className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Show all field mappings
          </button>
        </div>
      )}

      {/* Feedback for non-mismatch, non-high-confidence */}
      {!ingestion.mismatch && !isHighConfidence && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border mb-3">
          <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs font-body text-muted-foreground">{ingestion.feedbackMessage}</p>
        </div>
      )}

      {/* Unmapped required fields warning */}
      {!allRequiredMapped && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10 mb-3">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-xs font-body text-destructive font-medium">
            {requiredMappings.filter(m => !m.mappedTo).length} required field(s) need mapping before this file can be used.
          </p>
        </div>
      )}

      {/* Detailed mapping table */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          {isHighConfidence && (
            <button
              onClick={() => setShowDetails(false)}
              className="inline-flex items-center gap-1.5 text-xs font-display font-bold text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Hide details
            </button>
          )}

          {/* Required Fields */}
          {requiredMappings.length > 0 && (
            <div className="mb-4">
              <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Required Fields
              </p>
              <div className="space-y-1.5">
                {requiredMappings.map(m => (
                  <MappingRow key={m.canonical} mapping={m} onChange={handleMappingChange} />
                ))}
              </div>
            </div>
          )}

          {/* Optional Fields */}
          {optionalMappings.length > 0 && (
            <div className="mb-4">
              <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Optional Fields
              </p>
              <div className="space-y-1.5">
                {optionalMappings.map(m => (
                  <MappingRow key={m.canonical} mapping={m} onChange={handleMappingChange} />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-border">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-display font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(mappings)}
          disabled={!allRequiredMapped}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-xs font-display font-bold uppercase tracking-wide hover:scale-105 transition-transform disabled:opacity-40 disabled:hover:scale-100"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {isHighConfidence ? "Confirm & Continue" : "Confirm Mapping"}
        </button>
      </div>
    </motion.div>
  );
};

interface MappingRowProps {
  mapping: ColumnMapping;
  onChange: (canonical: string, newHeader: string) => void;
}

const MappingRow = ({ mapping, onChange }: MappingRowProps) => {
  const isMapped = !!mapping.mappedTo;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex-shrink-0 w-5">
        {isMapped ? (
          <CheckCircle className="w-4 h-4 text-primary" />
        ) : mapping.required ? (
          <AlertTriangle className="w-4 h-4 text-destructive" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-border" />
        )}
      </div>

      {/* Original header → Canonical label */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        {isMapped && (
          <>
            <span className="text-xs font-body text-muted-foreground truncate max-w-[120px]" title={mapping.mappedTo!}>
              {mapping.mappedTo}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          </>
        )}
        <span className="text-xs font-display font-bold">
          {mapping.label}
        </span>
        {mapping.required && !isMapped && (
          <span className="ml-0.5 text-xs text-destructive font-bold">*</span>
        )}
        {mapping.autoMapped && isMapped && (
          <span className="text-[10px] font-display uppercase tracking-wide text-primary/60">auto</span>
        )}
      </div>

      <div className="relative flex-shrink-0">
        <select
          value={mapping.mappedTo || ''}
          onChange={(e) => onChange(mapping.canonical, e.target.value)}
          className="appearance-none text-xs font-body bg-background border border-border rounded-lg px-3 py-1.5 pr-7 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
        >
          <option value="">— Not mapped —</option>
          {mapping.alternatives.filter(Boolean).map(alt => (
            <option key={alt} value={alt}>{alt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
};

export default ColumnMappingDialog;
