import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import triviumLogo from "@/assets/trivium-logo.png";
import NotFound from "./NotFound";
import { parseDSPReport } from "@/lib/dsp-data";
import { generateHighlights, type Highlights } from "@/lib/highlights";
import { getClientBySlug } from "@/config/clients";

/**
 * /:slug/highlights — internal-only bullet-point view.
 *
 * Auto-generated from the same CSV the dashboard uses. Same W2-vs-W1
 * analysis pattern as the Slack briefing. Strategists use this as a
 * baseline draft; they write their own client-facing analysis around
 * the visual report (which lives at /:slug/visual).
 */
const BrandHighlights = () => {
  const { slug } = useParams<{ slug: string }>();
  const client = getClientBySlug(slug);

  const [highlights, setHighlights] = useState<Highlights | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    setHighlights(null);
    setLoadError(null);
    fetch(`/data/${client.slug}/dsp.csv`)
      .then((r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        const ct = r.headers.get("content-type") || "";
        if (ct.includes("text/html")) throw new Error("html_fallback");
        return r.text();
      })
      .then((text) => {
        const trimmed = text.trim();
        if (!trimmed || trimmed.startsWith("<") || trimmed.split("\n").length < 2) {
          setLoadError("Report not yet generated. Bullets will appear once data ingests.");
          return;
        }
        setHighlights(generateHighlights(parseDSPReport(text)));
      })
      .catch(() => setLoadError("Unable to load report data."));
  }, [client]);

  if (!client) return <NotFound />;

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-18 py-4">
          <div className="flex items-center gap-0.5">
            <img src={triviumLogo} alt="Trivium" className="h-10 w-auto" />
            <span className="font-display font-extrabold text-xl uppercase tracking-tight">
              TRIVIUM
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline font-display font-bold text-xs uppercase tracking-widest text-muted-foreground">
              {client.name} · Internal Highlights
            </span>
            <Link
              to={`/${client.slug}/visual`}
              className="text-xs font-display font-bold uppercase tracking-wider text-primary hover:underline"
            >
              Visual →
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <p className="uppercase tracking-[0.2em] text-xs font-display font-bold text-muted-foreground mb-3">
            Internal Baseline · Auto-generated from data
          </p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mb-2">
            {client.name} — Strategic Highlights
          </h1>
          {highlights && (
            <p className="text-sm text-muted-foreground font-body">
              Reporting Period: {highlights.periodStart} — {highlights.periodEnd}
            </p>
          )}
        </div>

        {loadError && (
          <div className="bg-muted/60 border border-border rounded-2xl p-6 mb-8">
            <p className="font-display font-semibold text-base mb-1">Highlights pending</p>
            <p className="text-sm text-muted-foreground font-body">{loadError}</p>
          </div>
        )}

        {highlights && (
          <>
            <p className="text-xs text-muted-foreground italic font-body mb-6">
              Week 2 = {highlights.w2Range} compared against Week 1 = {highlights.w1Range}
            </p>

            <div className="space-y-6">
              {highlights.bullets.map((b, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl p-6 shadow-sm"
                >
                  <p className="font-display font-extrabold text-base sm:text-lg leading-snug text-foreground mb-3">
                    {b.takeaway}
                  </p>
                  <p className="text-sm text-foreground font-body mb-3 leading-relaxed">
                    {b.body}
                  </p>
                  <p className="text-sm text-muted-foreground font-body italic leading-relaxed">
                    {b.implication}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground font-body leading-relaxed">
                These bullets are a data-derived <strong>baseline</strong> for internal
                strategist use. They are NOT client-facing. The client-facing send is
                the <Link
                  to={`/${client.slug}/visual`}
                  className="text-primary hover:underline"
                >visual-only dashboard</Link>; the strategist writes their own
                analysis to accompany it.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default BrandHighlights;
