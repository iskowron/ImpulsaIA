import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo local, proxy /api/* a un servidor local con las funciones
    // Para testear las API routes en local, podes usar `vercel dev` en vez de `npm run dev`
    proxy: {},
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
