import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Store original env
const originalEnv = { ...process.env };

describe("Rate Limit Service", () => {
  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  describe("estimateTokens (pure function)", () => {
    it("should estimate tokens based on character count", async () => {
      process.env.RATE_LIMIT_ENABLED = "false"; // Disable to avoid Redis init
      const { estimateTokens } = await import("./rateLimit");

      // ~4 characters per token
      expect(estimateTokens("hello")).toBe(2); // 5 chars = ceil(5/4) = 2
      expect(estimateTokens("")).toBe(0);
      expect(estimateTokens("a")).toBe(1);
      expect(estimateTokens("abcd")).toBe(1); // 4 chars = 1 token
      expect(estimateTokens("abcde")).toBe(2); // 5 chars = 2 tokens
    });

    it("should handle long text", async () => {
      process.env.RATE_LIMIT_ENABLED = "false";
      const { estimateTokens } = await import("./rateLimit");

      const longText = "a".repeat(1000);
      expect(estimateTokens(longText)).toBe(250); // 1000/4 = 250
    });

    it("should handle unicode text", async () => {
      process.env.RATE_LIMIT_ENABLED = "false";
      const { estimateTokens } = await import("./rateLimit");

      // Unicode characters are still counted by length
      const emoji = "Hello 🍕"; // 8 chars (emoji is 2 chars in JS)
      expect(estimateTokens(emoji)).toBe(2);
    });
  });

  describe("generateIdentifier (pure function)", () => {
    it("should combine IP and fingerprint when both provided", async () => {
      process.env.RATE_LIMIT_ENABLED = "false";
      const { generateIdentifier } = await import("./rateLimit");

      expect(generateIdentifier("192.168.1.1", "abc123")).toBe(
        "192.168.1.1:abc123"
      );
    });

    it("should return IP only when fingerprint not provided", async () => {
      process.env.RATE_LIMIT_ENABLED = "false";
      const { generateIdentifier } = await import("./rateLimit");

      expect(generateIdentifier("192.168.1.1")).toBe("192.168.1.1");
      expect(generateIdentifier("192.168.1.1", undefined)).toBe("192.168.1.1");
    });

    it("should handle IPv6 addresses", async () => {
      process.env.RATE_LIMIT_ENABLED = "false";
      const { generateIdentifier } = await import("./rateLimit");

      expect(generateIdentifier("::1", "fingerprint")).toBe("::1:fingerprint");
    });

    it("should handle empty fingerprint string", async () => {
      process.env.RATE_LIMIT_ENABLED = "false";
      const { generateIdentifier } = await import("./rateLimit");

      // Empty string is falsy, so should return IP only
      expect(generateIdentifier("192.168.1.1", "")).toBe("192.168.1.1");
    });
  });

  describe("when rate limiting is disabled via RATE_LIMIT_ENABLED=false", () => {
    beforeEach(() => {
      process.env.RATE_LIMIT_ENABLED = "false";
      process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    });

    it("checkBurstLimit should always return success", async () => {
      const { checkBurstLimit } = await import("./rateLimit");

      const result = await checkBurstLimit("test-user");

      expect(result.success).toBe(true);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("checkTokenBudget should always allow even for huge token requests", async () => {
      const { checkTokenBudget } = await import("./rateLimit");

      const result = await checkTokenBudget("test-user", 999999);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10000);
      expect(result.limit).toBe(10000);
    });

    it("deductTokens should return full budget without deducting", async () => {
      const { deductTokens } = await import("./rateLimit");

      const result = await deductTokens("test-user", 5000);

      expect(result.remaining).toBe(10000);
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("getRateLimitStatus should return unlimited status with no feedback option", async () => {
      const { getRateLimitStatus } = await import("./rateLimit");

      const result = await getRateLimitStatus("test-user");

      expect(result.remaining).toBe(10000);
      expect(result.limit).toBe(10000);
      expect(result.canProvideFeedback).toBe(false); // No need for feedback when unlimited
      expect(result.reset).toBeGreaterThan(Date.now());
    });

    it("grantFeedbackBonus should return disabled message", async () => {
      const { grantFeedbackBonus } = await import("./rateLimit");

      const result = await grantFeedbackBonus("test-user");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Rate limiting is disabled.");
      expect(result.newRemaining).toBe(10000);
    });

    it("storeFeedback should not throw (logs instead)", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const { storeFeedback } = await import("./rateLimit");

      await expect(
        storeFeedback("test-user", 8, "test context")
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Feedback] Rate limiting disabled, skipping storage:",
        expect.objectContaining({ score: 8 })
      );

      consoleSpy.mockRestore();
    });
  });

  describe("when Redis credentials are missing", () => {
    beforeEach(() => {
      process.env.RATE_LIMIT_ENABLED = "true";
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it("should behave as if rate limiting is disabled", async () => {
      const { checkBurstLimit, checkTokenBudget, getRateLimitStatus } =
        await import("./rateLimit");

      const burstResult = await checkBurstLimit("test-user");
      expect(burstResult.success).toBe(true);

      const tokenResult = await checkTokenBudget("test-user", 50000);
      expect(tokenResult.allowed).toBe(true);

      const statusResult = await getRateLimitStatus("test-user");
      expect(statusResult.remaining).toBe(10000);
    });

    it("grantFeedbackBonus should return disabled message", async () => {
      const { grantFeedbackBonus } = await import("./rateLimit");

      const result = await grantFeedbackBonus("test-user");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Rate limiting is disabled.");
    });
  });

  describe("when only URL is provided (missing token)", () => {
    beforeEach(() => {
      process.env.RATE_LIMIT_ENABLED = "true";
      process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });

    it("should behave as if rate limiting is disabled", async () => {
      const { checkBurstLimit } = await import("./rateLimit");

      const result = await checkBurstLimit("test-user");
      expect(result.success).toBe(true);
    });
  });

  describe("reset time calculations", () => {
    beforeEach(() => {
      process.env.RATE_LIMIT_ENABLED = "false";
    });

    it("checkBurstLimit reset should be ~1 minute in the future", async () => {
      const { checkBurstLimit } = await import("./rateLimit");

      const before = Date.now();
      const result = await checkBurstLimit("test-user");
      const after = Date.now();

      // Reset should be approximately 1 minute (60000ms) in the future
      const expectedMin = before + 50000; // Allow 10s tolerance
      const expectedMax = after + 70000;

      expect(result.reset).toBeGreaterThanOrEqual(expectedMin);
      expect(result.reset).toBeLessThanOrEqual(expectedMax);
    });

    it("checkTokenBudget reset should be ~1 hour in the future", async () => {
      const { checkTokenBudget } = await import("./rateLimit");

      const before = Date.now();
      const result = await checkTokenBudget("test-user", 100);
      const after = Date.now();

      // Reset should be approximately 1 hour (3600000ms) in the future
      const expectedMin = before + 3500000; // Allow 100s tolerance
      const expectedMax = after + 3700000;

      expect(result.reset).toBeGreaterThanOrEqual(expectedMin);
      expect(result.reset).toBeLessThanOrEqual(expectedMax);
    });
  });
});
