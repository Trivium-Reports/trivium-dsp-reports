import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import triviumLogo from "@/assets/trivium-logo.png";
import LandingHero from "@/components/LandingHero";
import DSPReport from "@/components/DSPReport";
import ConversionPathSection from "@/components/ConversionPathSection";
import NotFound from "./NotFound";
import { parseDSPReport, type DSPSummary } from "@/lib/dsp-data";
import { getClientBySlug } from "@/config/clients";

type AppView = "landing" | "report";

const Index = () => {
  const { slug } = useParams<{ slug: string }>();
  const client = getClientBySlug(slug);

  const [view, setView] = useState<AppView>("landing");
  const [dspData, setDspData] = useState<DSPSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return; // unknown slug — falls through to NotFound below
    setDspData(null);
    setLoadError(null);
    fetch(`/data/${client.slug}/dsp.csv`)
      .then(r => {
        if (!r.ok) throw new Error(`CSV fetch failed: ${r.status}`);
        // SPA fallback returns text/html when the file doesn't exist
        const ct = r.headers.get("content-type") || "";
        if (ct.includes("text/html")) throw new Error("html_fallback");
        return r.text();
      })
      .then(text => {
        const trimmed = text.trim();
        // Defensive: HTML fallback (starts with "<") or empty / header-only file
        if (!trimmed || trimmed.startsWith("<") || trimmed.split("\n").length < 2) {
          setLoadError("Report not yet generated. Data will appear once the next refresh runs.");
          return;
        }
        setDspData(parseDSPReport(text));
      })
      .catch(err => {
        console.error(`Failed to load ${client.slug} DSP data:`, err);
        setLoadError("Unable to load report data.");
      });
  }, [client]);

  // Unknown or inactive slug — show 404 (no list of valid clients exposed)
  if (!client) return <NotFound />;

  const dateRange = dspData
    ? (() => {
        const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${fmt(dspData.dateRange.start)} — ${fmt(dspData.dateRange.end)}`;
      })()
    : undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-18 py-4">
          <div className="flex items-center gap-0.5 cursor-pointer" onClick={() => setView("landing")}>
            <img src={triviumLogo} alt="Trivium" className="h-10 w-auto" />
            <span className="font-display font-extrabold text-xl uppercase tracking-tight">
              TRIVIUM
            </span>
          </div>
          {view === "landing" && dspData && (
            <button
              onClick={() => setView("report")}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm uppercase tracking-wide hover:scale-105 transition-transform"
            >
              View Report
            </button>
          )}
          {view === "report" && (
            <span className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
              {client.name} · DSP Performance Report
            </span>
          )}
        </div>
      </nav>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {view === "landing" && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <LandingHero
                onViewReport={() => setView("report")}
                brandName={dspData?.brand ?? client.name}
                dateRange={dateRange}
              />
              {loadError && (
                <div className="max-w-2xl mx-auto px-4 -mt-8 pb-12">
                  <div className="bg-muted/60 border border-border rounded-2xl p-6 text-center">
                    <p className="font-display font-semibold text-base mb-1">Report pending</p>
                    <p className="text-sm text-muted-foreground font-body">{loadError}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {view === "report" && dspData && (
            <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <DSPReport data={dspData} />
              {/* Mirai-only: Sponsored Ads conversion path section.
                  Component silently renders nothing if the conv-path CSV is absent. */}
              {client.slug === "mirai-clinical" && (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                  <ConversionPathSection slug={client.slug} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
