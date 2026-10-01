import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The backend URL (incl. its port) comes from the env, so the port lives in one place.
  // `npm run register` sets VITE_BACKEND_URL when the app has a backend.
  const backendUrl = loadEnv(mode, process.cwd(), "").VITE_BACKEND_URL;
  return {
    server: {
      port: 3004,
      // Vite delegates to the OS opener (`open`/`start`/`xdg-open`), which
      // reuses an existing tab on the dev URL when the browser supports it
      // (Chrome, Safari, Edge) instead of opening a new one.
      open: true,
      ...(backendUrl && {
        proxy: {
          "/api": {
            target: backendUrl,
            changeOrigin: true,
          },
        },
      }),
    },
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        "/assets": path.join(
          path.dirname(require.resolve("@jtl-software/platform-ui-react")),
          "assets",
        ),
      },
    },
  };
});
