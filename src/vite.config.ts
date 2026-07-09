import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createInternalApiMiddleware } from './server/internalApi';

declare const process: {
  cwd: () => string;
  env: Record<string, string | undefined>;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  process.env.GEMINI_API_KEY ||= env.GEMINI_API_KEY;
  process.env.GEMINI_MODEL ||= env.GEMINI_MODEL;

  return {
    base: './',
    plugins: [
      react(),
      {
        name: 'travel-blocks-internal-api',
        configureServer(server) {
          server.middlewares.use(createInternalApiMiddleware());
        },
        configurePreviewServer(server) {
          server.middlewares.use(createInternalApiMiddleware());
        },
      },
    ],
    preview: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: true,
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: true,
    },
  };
});
