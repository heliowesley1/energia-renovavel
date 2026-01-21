import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // Esta é a linha que estava falhando
import path from "path";

export default defineConfig({
  base: '/energia_renovavel/', 
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});