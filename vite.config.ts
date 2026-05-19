import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
//
// Note: lovable-tagger removed from this per-client deck build.
// Also swapped @vitejs/plugin-react-swc → @vitejs/plugin-react (Babel-based) —
// the SWC native binary was hanging the build at "transforming (1) index.html"
// indefinitely. Babel is slower (~30s vs ~10s) but rock-solid across Mac configs.
// We don't use Lovable at runtime per the master prompt — the template is
// treated as a regular Node project.
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
