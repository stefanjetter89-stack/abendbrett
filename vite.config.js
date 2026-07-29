import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" macht den Build auch in Unterordnern lauffähig (z. B. GitHub Pages)
export default defineConfig({
  plugins: [react()],
  base: "./",
});
