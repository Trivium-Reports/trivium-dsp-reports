import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RootLanding from "./pages/RootLanding.tsx";
import Index from "./pages/Index.tsx";
import InternalHub from "./pages/InternalHub.tsx";
import BrandHighlights from "./pages/BrandHighlights.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

// Multi-client monorepo:
//   /                     → minimal Trivium-branded landing (NO client list — privacy by design)
//   /internal             → internal team brand index (hidden URL — not linked anywhere public)
//   /<slug>               → full per-client dashboard (internal use — mixes visuals + prose)
//   /<slug>/visual        → visual-only dashboard (client-send URL — no interpretive prose)
//   /<slug>/highlights    → auto-generated bullet-point baseline (internal strategist use)
//   /*  (other)           → 404
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLanding />} />
          <Route path="/internal" element={<InternalHub />} />
          <Route path="/:slug" element={<Index />} />
          <Route path="/:slug/visual" element={<Index mode="visual" />} />
          <Route path="/:slug/highlights" element={<BrandHighlights />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
