import { vi } from "vitest";

// Mock the ResizeObserver API
import ResizeObserverPolyfill from "resize-observer-polyfill";
if (!global.ResizeObserver) {
  global.ResizeObserver = ResizeObserverPolyfill;
}

// Use the matchers from jest-dom in vitest
import matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

expect.extend(matchers);

// Mock the canvas
import "vitest-canvas-mock";

// Mock the web audio api
import "./test/audio";
