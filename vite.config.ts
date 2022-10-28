/// <reference types="vite" />
import { defineConfig, UserConfig as ViteConfig } from "vite";
import { UserConfig as VitestConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const vitestConfig: VitestConfig = {
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    deps: {
      inline: ["vitest-canvas-mock"],
    },
  },
};

const config: ViteConfig = {
  plugins: [svelte({ hot: !process.env.VITEST })],
};

// https://vitejs.dev/config/

export default defineConfig({
  ...vitestConfig,
  ...config,
} as any);
