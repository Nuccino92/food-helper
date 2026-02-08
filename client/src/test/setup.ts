import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock fetch
(globalThis as Record<string, unknown>).fetch = vi.fn();

// Mock import.meta.env
vi.stubGlobal("import.meta", {
  env: {
    VITE_API_URL: "http://localhost:8000/api",
  },
});
