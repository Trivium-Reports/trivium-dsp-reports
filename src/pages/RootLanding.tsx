import triviumLogo from "@/assets/trivium-logo.png";

/**
 * Root "/" landing page.
 *
 * Intentionally minimal — does NOT list clients (privacy by design).
 * Each client receives a direct URL to their own /<slug> dashboard.
 * Random visitors who land on the bare domain see only Trivium branding.
 */
const RootLanding = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-3 mb-6">
        <img src={triviumLogo} alt="Trivium" className="h-12 w-auto" />
        <span className="font-display font-extrabold text-2xl uppercase tracking-tight">
          TRIVIUM
        </span>
      </div>
      <p className="uppercase tracking-[0.2em] text-xs font-display font-bold text-muted-foreground mb-4">
        DSP Performance Reporting
      </p>
      <p className="max-w-md text-center text-base text-muted-foreground font-body leading-relaxed">
        Please use the direct link your Trivium strategist provided to access your report.
      </p>
    </div>
  );
};

export default RootLanding;
