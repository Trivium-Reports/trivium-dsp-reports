import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, XCircle, FileText, ArrowLeft, Calendar, Info, AlertTriangle, Zap } from "lucide-react";
import SectionWrapper from "./SectionWrapper";
import AMCTroubleshooter from "./AMCTroubleshooter";
import ColumnMappingDialog from "./ColumnMappingDialog";
import { parseCSV } from "@/lib/csv-parser";
import { ingestFile, normalizeRows, getAvailableCanonicalFields } from "@/lib/ingestion-engine";
import type { ColumnMapping } from "@/lib/ingestion-engine";
import type { UploadSlot, ReportingWindow } from "@/lib/types";

interface UploadSectionProps {
  reportingWindow: ReportingWindow;
  onComplete: (slots: UploadSlot[]) => void;
  onBack?: () => void;
}

const initialSlots: UploadSlot[] = [
  { id: "dsp", label: "DSP Campaign Performance", description: "Campaign-level performance export from DSP console", required: true, file: null, status: "empty" },
  { id: "sponsored-ads", label: "Sponsored Ads Performance", description: "Campaign or ad group level performance export", required: true, file: null, status: "empty" },
  { id: "amc-converters", label: "AMC — Converters vs Non-Converters", description: "Purchase path analysis use case export", required: false, file: null, status: "empty" },
  { id: "amc-frequency", label: "AMC — Optimal Frequency", description: "Frequency cap analysis use case export", required: false, file: null, status: "empty" },
  { id: "amc-reach", label: "AMC — Net-New Reach", description: "New-to-brand / reach analysis use case export", required: false, file: null, status: "empty" },
  { id: "amc-interaction", label: "AMC — Exposure Group Overlap (Optional)", description: "DSP + Sponsored Ads exposure group analysis. If not uploaded, interaction insights are derived from DSP & SA exports.", required: false, file: null, status: "empty" },
];

const UploadSection = ({ reportingWindow, onComplete, onBack }: UploadSectionProps) => {
  const [slots, setSlots] = useState<UploadSlot[]>(initialSlots);

  const handleFileChange = useCallback(
    async (slotId: string, file: File | null) => {
      if (!file) return;

      setSlots((prev) =>
        prev.map((s) => s.id === slotId ? { ...s, file, status: "uploading" as const } : s)
      );

      try {
        const text = await file.text();
        const { headers, rows } = parseCSV(text);

        if (headers.length === 0 || rows.length === 0) {
          const isAmcSlot = slotId.startsWith("amc");
          setSlots((prev) =>
            prev.map((s) =>
              s.id === slotId
                ? {
                    ...s,
                    status: "error" as const,
                    errorMessage: rows.length === 0 && headers.length > 0
                      ? "This file has the right structure, but contains no usable rows."
                      : "File appears empty or is not valid CSV.",
                    showTroubleshooter: isAmcSlot && rows.length === 0,
                  }
                : s
            )
          );
          return;
        }

        // Run ingestion engine
        const ingestion = ingestFile(slotId, headers, rows);

        // High confidence + all required met + no mismatch → auto-accept
        if (ingestion.confidence === 'high' && ingestion.requiredMet && !ingestion.mismatch) {
          const normalized = normalizeRows(rows, ingestion.columnMappings);
          const availableFields = getAvailableCanonicalFields(ingestion.columnMappings);
          setSlots((prev) =>
            prev.map((s) =>
              s.id === slotId
                ? {
                    ...s,
                    status: "valid" as const,
                    data: normalized as unknown as Record<string, unknown>[],
                    columns: headers,
                    ingestion,
                    confirmedMappings: ingestion.columnMappings,
                    isPartial: ingestion.isPartial,
                    availableFields,
                    errorMessage: ingestion.isPartial ? ingestion.feedbackMessage : undefined,
                  }
                : s
            )
          );
        } else {
          // Show mapping review for medium/low confidence or missing fields
          setSlots((prev) =>
            prev.map((s) =>
              s.id === slotId
                ? {
                    ...s,
                    status: "mapping" as const,
                    data: rows as unknown as Record<string, unknown>[],
                    columns: headers,
                    ingestion,
                  }
                : s
            )
          );
        }
      } catch {
        setSlots((prev) =>
          prev.map((s) =>
            s.id === slotId ? { ...s, status: "error" as const, errorMessage: "Failed to parse CSV file." } : s
          )
        );
      }
    },
    []
  );

  const handleMappingConfirm = useCallback((slotId: string, updatedMappings: ColumnMapping[]) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== slotId || !s.data) return s;
        const rows = s.data as unknown as Record<string, string>[];
        const normalized = normalizeRows(rows, updatedMappings);
        const availableFields = getAvailableCanonicalFields(updatedMappings);
        const requiredMet = updatedMappings.filter(m => m.required).every(m => m.mappedTo);
        const isPartial = requiredMet && updatedMappings.some(m => !m.required && !m.mappedTo);
        return {
          ...s,
          status: requiredMet ? "valid" as const : "error" as const,
          data: normalized as unknown as Record<string, unknown>[],
          confirmedMappings: updatedMappings,
          isPartial,
          availableFields,
          errorMessage: !requiredMet
            ? "Some required fields are still unmapped."
            : isPartial
            ? `Mapped ${updatedMappings.filter(m => m.mappedTo).length} of ${updatedMappings.length} fields. File is usable.`
            : undefined,
        };
      })
    );
  }, []);

  const handleMappingCancel = useCallback((slotId: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, status: "empty" as const, file: null, data: undefined, columns: undefined, ingestion: undefined }
          : s
      )
    );
  }, []);

  const handleReassign = useCallback((fromSlotId: string, toSlotId: string) => {
    setSlots((prev) => {
      const fromSlot = prev.find(s => s.id === fromSlotId);
      if (!fromSlot || !fromSlot.file) return prev;

      // Clear from-slot and trigger upload on to-slot
      const updated = prev.map((s) => {
        if (s.id === fromSlotId) {
          return { ...s, status: "empty" as const, file: null, data: undefined, columns: undefined, ingestion: undefined };
        }
        return s;
      });
      return updated;
    });

    // Re-trigger upload on the target slot
    const fromSlot = slots.find(s => s.id === fromSlotId);
    if (fromSlot?.file) {
      setTimeout(() => handleFileChange(toSlotId, fromSlot.file), 100);
    }
  }, [slots, handleFileChange]);

  const hasAnyFile = slots.some((s) => s.status === "valid");

  const statusIcon = (status: UploadSlot["status"]) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case "error":
        return <XCircle className="w-5 h-5 text-destructive" />;
      case "uploading":
        return <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case "mapping":
        return <AlertTriangle className="w-5 h-5 text-primary/70" />;
      default:
        return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const requiredSlots = slots.filter(s => s.required);
  const optionalSlots = slots.filter(s => !s.required);

  return (
    <SectionWrapper>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h2 className="section-heading mb-4">
            Upload Your <span className="text-primary">Exports</span>
          </h2>
          <p className="section-subheading">
            Upload your DSP, Sponsored Ads, and AMC CSV files. We'll auto-detect file types and map columns for you.
          </p>
        </motion.div>

        {/* Reporting window */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-6 mb-6 shadow-sm border border-border"
        >
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-sm uppercase tracking-wide">
              Reporting Window
            </h3>
          </div>
          <p className="font-body text-sm text-foreground mb-1">
            <span className="font-semibold">{reportingWindow.startDate}</span>{" "}to{" "}
            <span className="font-semibold">{reportingWindow.endDate}</span>
          </p>
          <p className="font-body text-xs text-muted-foreground flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            Please make sure all uploads were exported for the same reporting window.
          </p>
        </motion.div>

        {/* Required uploads */}
        <div className="mb-3">
          <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Platform Exports
          </p>
        </div>
        <div className="space-y-3 mb-8">
          {requiredSlots.map((slot, i) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              index={i}
              statusIcon={statusIcon}
              onFileChange={handleFileChange}
              onMappingConfirm={handleMappingConfirm}
              onMappingCancel={handleMappingCancel}
              onReassign={handleReassign}
            />
          ))}
        </div>

        {/* Optional AMC uploads */}
        <div className="mb-3">
          <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-1 px-1">
            AMC Use Case Exports
          </p>
          <p className="font-body text-xs text-muted-foreground px-1 mb-3">
            Optional — each AMC file unlocks a deeper analysis section.
          </p>
        </div>
        <div className="space-y-3">
          {optionalSlots.map((slot, i) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              index={i + requiredSlots.length}
              statusIcon={statusIcon}
              onFileChange={handleFileChange}
              onMappingConfirm={handleMappingConfirm}
              onMappingCancel={handleMappingCancel}
              onReassign={handleReassign}
            />
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-10 flex flex-col items-center gap-4">
          <button
            onClick={() => onComplete(slots)}
            disabled={!hasAnyFile}
            className="inline-flex items-center px-10 py-5 rounded-full bg-primary text-primary-foreground font-display font-bold text-lg uppercase tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            Generate Strategic Report
          </button>
          {!hasAnyFile && (
            <p className="font-body text-xs text-muted-foreground">Upload at least one file to generate your report.</p>
          )}
          {hasAnyFile && slots.some(s => s.status === "empty") && (
            <p className="font-body text-xs text-muted-foreground">Missing files will be skipped — the report adapts to what you provide.</p>
          )}
          {onBack && (
            <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-display font-bold text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Onboarding
            </button>
          )}
        </motion.div>
      </div>
    </SectionWrapper>
  );
};

interface SlotCardProps {
  slot: UploadSlot;
  index: number;
  statusIcon: (status: UploadSlot["status"]) => React.ReactNode;
  onFileChange: (slotId: string, file: File | null) => void;
  onMappingConfirm: (slotId: string, mappings: ColumnMapping[]) => void;
  onMappingCancel: (slotId: string) => void;
  onReassign: (fromSlotId: string, toSlotId: string) => void;
}

const SlotCard = ({ slot, index, statusIcon, onFileChange, onMappingConfirm, onMappingCancel, onReassign }: SlotCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="bg-card rounded-2xl p-5 shadow-sm border border-border"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 flex-1">
        {statusIcon(slot.status)}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-sm">{slot.label}</h3>
            {slot.required && (
              <span className="text-xs font-display font-bold uppercase tracking-wide text-primary">Required</span>
            )}
          </div>
          <p className="font-body text-xs text-muted-foreground mt-1">{slot.description}</p>

          {/* Valid state feedback */}
          {slot.status === "valid" && slot.columns && (
            <div className="mt-2 space-y-1">
              <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-primary" />
                {(slot.data as unknown[])?.length} rows • {slot.columns.length} columns
                {slot.isPartial && " • Partial dataset"}
              </p>
              {slot.ingestion && (
                <p className="font-body text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  Detected as {slot.ingestion.detectedLabel} •{" "}
                  {slot.ingestion.requiredMapped + slot.ingestion.optionalMapped} of{" "}
                  {slot.ingestion.requiredTotal + slot.ingestion.optionalTotal} fields mapped
                </p>
              )}
            </div>
          )}

          {/* Error state */}
          {slot.status === "error" && slot.errorMessage && (
            <p className="font-body text-xs text-destructive mt-2">{slot.errorMessage}</p>
          )}
          {slot.status === "error" && slot.showTroubleshooter && (
            <div className="mt-3"><AMCTroubleshooter inline /></div>
          )}

          {/* Partial warning on valid */}
          {slot.status === "valid" && slot.errorMessage && (
            <p className="font-body text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {slot.errorMessage}
            </p>
          )}
        </div>
      </div>
      <label className="cursor-pointer flex-shrink-0">
        <input type="file" accept=".csv" className="hidden" onChange={(e) => onFileChange(slot.id, e.target.files?.[0] || null)} />
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background text-sm font-display font-bold uppercase tracking-wide hover:bg-muted transition-colors">
          <Upload className="w-4 h-4" />
          {slot.file ? "Replace" : "Upload"}
        </span>
      </label>
    </div>

    {/* Column mapping dialog */}
    <AnimatePresence>
      {slot.status === "mapping" && slot.ingestion && (
        <ColumnMappingDialog
          ingestion={slot.ingestion}
          onConfirm={(mappings) => onMappingConfirm(slot.id, mappings)}
          onCancel={() => onMappingCancel(slot.id)}
          onReassign={slot.ingestion.mismatch && slot.ingestion.suggestedSlotId
            ? (suggestedId) => onReassign(slot.id, suggestedId)
            : undefined
          }
        />
      )}
    </AnimatePresence>
  </motion.div>
);

export default UploadSection;
