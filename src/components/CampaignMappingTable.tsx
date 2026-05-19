import { useState, useCallback } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

export interface CampaignMapping {
  campaignName: string;
  campaignId: string;
  label: "TOF" | "MOF" | "BOF" | "Sponsored" | "";
}

interface CampaignMappingTableProps {
  mappings: CampaignMapping[];
  onChange: (mappings: CampaignMapping[]) => void;
}

const LABEL_OPTIONS: { value: CampaignMapping["label"]; display: string }[] = [
  { value: "", display: "Select…" },
  { value: "TOF", display: "TOF — Top of Funnel" },
  { value: "MOF", display: "MOF — Mid Funnel" },
  { value: "BOF", display: "BOF — Bottom of Funnel" },
  { value: "Sponsored", display: "Sponsored" },
];

const emptyRow = (): CampaignMapping => ({
  campaignName: "",
  campaignId: "",
  label: "",
});

const CampaignMappingTable = ({ mappings, onChange }: CampaignMappingTableProps) => {
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const addRow = () => onChange([...mappings, emptyRow()]);

  const removeRow = (idx: number) => {
    const next = mappings.filter((_, i) => i !== idx);
    onChange(next.length === 0 ? [emptyRow()] : next);
  };

  const updateField = (idx: number, field: keyof CampaignMapping, value: string) => {
    const next = [...mappings];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };

  const handlePaste = useCallback(() => {
    const lines = pasteText.trim().split("\n").filter(Boolean);
    const parsed: CampaignMapping[] = [];
    for (const line of lines) {
      const parts = line.split(/\t|,/).map((s) => s.trim());
      if (parts.length >= 2) {
        const labelRaw = (parts[2] || "").toUpperCase();
        const label = (["TOF", "MOF", "BOF", "SPONSORED"].includes(labelRaw)
          ? labelRaw === "SPONSORED" ? "Sponsored" : labelRaw
          : "") as CampaignMapping["label"];
        parsed.push({
          campaignName: parts[0],
          campaignId: parts[1],
          label,
        });
      }
    }
    if (parsed.length > 0) {
      onChange([...mappings.filter((m) => m.campaignName || m.campaignId), ...parsed]);
      setPasteText("");
      setPasteMode(false);
    }
  }, [pasteText, mappings, onChange]);

  const filledCount = mappings.filter((m) => m.campaignName && m.campaignId && m.label).length;

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="bg-muted/40 rounded-xl p-4">
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Optional but recommended.</span>{" "}
          Map your campaigns to funnel stages so the report can group performance
          by TOF, MOF, BOF, and Sponsored.
        </p>
      </div>

      {/* Helper text */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3 items-start">
        <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="font-body text-xs text-muted-foreground leading-relaxed">
          If you don't know which campaigns to include, first run AMC exploratory
          templates such as{" "}
          <span className="font-semibold text-foreground">
            "How to identify your campaigns and campaign IDs"
          </span>
          . Then copy the campaign IDs in scope and use them in your exported
          query outputs.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_160px_40px] gap-0 bg-muted/60 px-4 py-2.5">
          <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
            Campaign Name
          </p>
          <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
            Campaign ID
          </p>
          <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
            Label
          </p>
          <div />
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {mappings.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_1fr_160px_40px] gap-0 px-4 py-2 items-center bg-card hover:bg-muted/20 transition-colors"
            >
              <input
                type="text"
                placeholder="e.g. Brand – TOF – Display"
                value={row.campaignName}
                onChange={(e) => updateField(idx, "campaignName", e.target.value)}
                className="bg-transparent font-body text-sm border-none outline-none placeholder:text-muted-foreground/40 pr-2"
              />
              <input
                type="text"
                placeholder="e.g. 12345678"
                value={row.campaignId}
                onChange={(e) => updateField(idx, "campaignId", e.target.value)}
                className="bg-transparent font-body text-sm border-none outline-none placeholder:text-muted-foreground/40 pr-2"
              />
              <select
                value={row.label}
                onChange={(e) => updateField(idx, "label", e.target.value)}
                className="bg-transparent font-body text-sm border border-border rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/30"
              >
                {LABEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.display}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeRow(idx)}
                className="p-1 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={addRow}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-background font-display font-bold text-xs uppercase tracking-wide hover:bg-muted transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Row
        </button>
        <button
          onClick={() => setPasteMode(!pasteMode)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-background font-display font-bold text-xs uppercase tracking-wide hover:bg-muted transition-colors"
        >
          Paste from Spreadsheet
        </button>
        {filledCount > 0 && (
          <span className="font-body text-xs text-muted-foreground">
            {filledCount} campaign{filledCount !== 1 ? "s" : ""} mapped
          </span>
        )}
      </div>

      {/* Paste area */}
      {pasteMode && (
        <div className="space-y-2">
          <p className="font-body text-xs text-muted-foreground">
            Paste rows as: <code className="text-foreground">campaign_name, campaign_id, label</code>{" "}
            (tab or comma separated)
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={4}
            placeholder={"Brand – TOF – Display\t12345678\tTOF\nBrand – MOF – Retarget\t87654321\tMOF"}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <button
            onClick={handlePaste}
            disabled={!pasteText.trim()}
            className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-display font-bold text-xs uppercase tracking-wide hover:scale-105 transition-transform disabled:opacity-40"
          >
            Import Rows
          </button>
        </div>
      )}
    </div>
  );
};

export default CampaignMappingTable;
