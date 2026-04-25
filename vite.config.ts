import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers for smaller output
    target: "es2020",
    // Increase chunk size warning limit (MediaPipe is large by nature)
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Manual chunk splitting — keeps vendor code cached separately
        manualChunks(id) {
          // Firebase — changes infrequently, cache indefinitely
          if (id.includes("node_modules/firebase")) {
            return "firebase";
          }
          // TensorFlow — very large, isolate for long-term caching
          if (id.includes("node_modules/@tensorflow")) {
            return "tensorflow";
          }
          // MediaPipe — isolate heavy WASM-adjacent code
          if (id.includes("node_modules/@mediapipe")) {
            return "mediapipe";
          }
          // Radix UI + shadcn components — UI lib rarely changes
          if (id.includes("node_modules/@radix-ui")) {
            return "radix-ui";
          }
          // Recharts — data visualization library
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3")) {
            return "charts";
          }
          // General React ecosystem
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router-dom") ||
            id.includes("node_modules/@tanstack")
          ) {
            return "react-vendor";
          }
        },
        // Use content hash for long-term caching
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Sourcemaps only in dev
    sourcemap: mode === "development",
  },
  // Optimize dependency pre-bundling in dev
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "firebase/app",
      "firebase/auth",
      "firebase/database",
      "firebase/storage",
      "@tanstack/react-query",
      "lucide-react",
    ],
    // Exclude large WASM-based packages from pre-bundling
    exclude: ["@mediapipe/holistic", "@mediapipe/tasks-vision"],
  },
}));
