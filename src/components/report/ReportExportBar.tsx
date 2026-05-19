import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileDown, Copy, ClipboardCheck, Download, Share2, Check,
} from "lucide-react";
import { toast } from "sonner";
import type { UploadSlot } from "@/lib/types";
import type { DeterministicRecommendation } from "@/lib/analysis-engine";
import type { StrategicInsightCard } from "@/lib/chart-data";
import type { ExecutiveSummaryMetrics } from "@/lib/types";

interface ReportExportBarProps {
  metrics: ExecutiveSummaryMetrics;
  insightCards: StrategicInsightCard[];
  recommendations: DeterministicRecommendation[];
  slots: UploadSlot[];
  brandName?: string;
  dateRange: string;
}

const fmt = (n: number, prefix = "") => {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(n % 1 === 0 ? 0 : 2)}`;
};

function buildExecutiveSummaryText(
  metrics: ExecutiveSummaryMetrics,
  insightCards: StrategicInsightCard[],
  brandName?: string,
  dateRange?: string
): string {
  const lines: string[] = [];
  lines.push("═══ EXECUTIVE INTELLIGENCE SUMMARY ═══");
  if (brandName) lines.push(`Brand: ${brandName}`);
  if (dateRange) lines.push(`Period: ${dateRange}`);
  lines.push("");

  const totalSpend = (metrics.dspSpend || 0) + (metrics.saSpend || 0);
  const totalSales = metrics.saSales || 0;
  const roas = totalSpend > 0 && totalSales > 0 ? totalSales / totalSpend : 0;

  if (totalSpend > 0) lines.push(`Total Spend: ${fmt(totalSpend, "$")}`);
  if (totalSales > 0) lines.push(`Total Sales: ${fmt(totalSales, "$")}`);
  if (roas > 0) lines.push(`Blended ROAS: ${roas.toFixed(2)}x`);
  lines.push("");

  if (insightCards.length > 0) {
    lines.push("── Strategic Insights ──");
    for (const card of insightCards) {
      lines.push(`• ${card.title}: ${card.value} — ${card.description}`);
    }
  }

  return lines.join("\n");
}

function buildRecommendationsText(recommendations: DeterministicRecommendation[]): string {
  const lines: string[] = [];
  lines.push("═══ DECISION-ORIENTED NEXT STEPS ═══");
  lines.push("");
  for (const rec of recommendations) {
    const priority = rec.priority.toUpperCase();
    lines.push(`[${priority}] ${rec.title}`);
    lines.push(`  ${rec.description}`);
    lines.push("");
  }
  return lines.join("\n");
}

function downloadNormalizedCSV(slot: UploadSlot) {
  const data = slot.data as Record<string, string>[] | undefined;
  const columns = slot.columns;
  if (!data || !columns || data.length === 0) return;

  const csvLines: string[] = [];
  csvLines.push(columns.join(","));
  for (const row of data) {
    const vals = columns.map(col => {
      const val = String(row[col] ?? "");
      return val.includes(",") || val.includes('"') || val.includes("\n")
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    });
    csvLines.push(vals.join(","));
  }

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slot.id}-normalized.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const ReportExportBar = ({
  metrics, insightCards, recommendations, slots, brandName, dateRange,
}: ReportExportBarProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy — try again");
    }
  };

  const handlePDF = () => {
    window.print();
  };

  const handleCopyExecSummary = () => {
    const text = buildExecutiveSummaryText(metrics, insightCards, brandName, dateRange);
    copyToClipboard(text, "Executive Summary");
  };

  const handleCopyRecs = () => {
    const text = buildRecommendationsText(recommendations);
    copyToClipboard(text, "Recommendations");
  };

  const handleDownloadAll = () => {
    const validSlots = slots.filter(s => s.status === "valid" && s.data && s.columns);
    if (validSlots.length === 0) {
      toast.error("No datasets available to download");
      return;
    }
    for (const slot of validSlots) {
      downloadNormalizedCSV(slot);
    }
    toast.success(`${validSlots.length} normalized dataset(s) downloaded`);
  };

  const handleShareLink = async () => {
    // Generate a shareable link using the current URL with a hash
    const url = window.location.href.split("#")[0];
    try {
      await navigator.clipboard.writeText(url);
      setShareLink(url);
      toast.success("Report link copied to clipboard");
      setTimeout(() => setShareLink(null), 3000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const validSlotCount = slots.filter(s => s.status === "valid" && s.data).length;

  const actions = [
    {
      label: "Export PDF",
      icon: FileDown,
      onClick: handlePDF,
      active: false,
    },
    {
      label: copied === "Executive Summary" ? "Copied!" : "Copy Summary",
      icon: copied === "Executive Summary" ? Check : Copy,
      onClick: handleCopyExecSummary,
      active: copied === "Executive Summary",
    },
    {
      label: copied === "Recommendations" ? "Copied!" : "Copy Recs",
      icon: copied === "Recommendations" ? Check : ClipboardCheck,
      onClick: handleCopyRecs,
      active: copied === "Recommendations",
    },
    {
      label: `Download CSVs (${validSlotCount})`,
      icon: Download,
      onClick: handleDownloadAll,
      active: false,
      disabled: validSlotCount === 0,
    },
    {
      label: shareLink ? "Link Copied!" : "Share Link",
      icon: shareLink ? Check : Share2,
      onClick: handleShareLink,
      active: !!shareLink,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap items-center gap-2"
    >
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.onClick}
          disabled={'disabled' in action && action.disabled}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-display font-bold uppercase tracking-wide transition-all
            ${action.active
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-background hover:bg-muted text-foreground"
            }
            ${('disabled' in action && action.disabled) ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.02]"}
          `}
        >
          <action.icon className="w-3.5 h-3.5" />
          {action.label}
        </button>
      ))}
    </motion.div>
  );
};

export default ReportExportBar;
