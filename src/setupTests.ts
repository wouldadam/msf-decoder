// Use the matchers from jstest-dom in vitest
import matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

expect.extend(matchers);

// Mock the canvas
import "vitest-canvas-mock";
