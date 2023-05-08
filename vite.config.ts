/// <reference types="vite" />
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, UserConfig as ViteConfig } from "vite";
import { UserConfig as VitestConfig } from "vitest/config";

const vitestConfig: VitestConfig = {
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    deps: {
      inline: ["vitest-canvas-mock"],
    },
    coverage: {
      all: true,
      excludeNodeModules: true,
      exclude: [
        "storybook-static/**",
        "src/test/**",
        "dist/**",
        ".storybook/**",
        "*.config.{cjs,js,ts}",
        "**/*.d.ts",
        "**/*.stories.ts",
        "**/*.test.ts",
        "src/main.ts",
        "src/App.svelte",
      ],
    },
  },
};

const config: ViteConfig = {
  base: "/msf-decoder/",
  plugins: [svelte({ hot: !process.env.VITEST })],
};

// https://vitejs.dev/config/

export default defineConfig({
  ...vitestConfig,
  ...config,
} as any);
