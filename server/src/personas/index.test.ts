import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./index.js";

describe("buildSystemPrompt", () => {
  it("should include Miso persona for assistant-miso", () => {
    const prompt = buildSystemPrompt("assistant-miso", "7:00 PM");

    expect(prompt).toContain("Miso");
    expect(prompt).toContain("7:00 PM");
  });

  it("should include Gordon persona for assistant-gordon", () => {
    const prompt = buildSystemPrompt("assistant-gordon", "12:00 PM");

    expect(prompt).toContain("Chef G");
    expect(prompt).toContain("commanding");
  });

  it("should include Sancho persona for assistant-sancho", () => {
    const prompt = buildSystemPrompt("assistant-sancho", "9:00 PM");

    expect(prompt).toContain("inconvenienced waiter");
  });

  it("should default to Miso for unknown persona IDs", () => {
    const prompt = buildSystemPrompt("assistant-unknown", "5:00 PM");

    expect(prompt).toContain("Miso");
  });

  it("should include base rules in every prompt", () => {
    const prompt = buildSystemPrompt("assistant-miso", "5:00 PM");

    // Base rules contain the consultant mindset and tool guidance
    expect(prompt).toContain('"Consultant" Mindset');
  });

  it("should handle missing userLocalTime", () => {
    const prompt = buildSystemPrompt("assistant-miso", "");

    expect(prompt).toContain("Unknown");
  });
});
