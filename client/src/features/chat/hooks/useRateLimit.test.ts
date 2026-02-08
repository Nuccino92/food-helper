import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock environment
vi.stubGlobal("import.meta", {
  env: {
    VITE_API_URL: "http://localhost:8000/api",
  },
});

// We need to test the hook's logic without the actual imports
// since we need to mock fetch and localStorage

describe("useRateLimit hook", () => {
  const mockFetch = vi.fn();
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });

    // Mock navigator for fingerprinting
    Object.defineProperty(window, "navigator", {
      value: {
        userAgent: "test-agent",
        language: "en-US",
      },
      writable: true,
    });

    Object.defineProperty(window, "screen", {
      value: {
        width: 1920,
        height: 1080,
        colorDepth: 24,
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe("fingerprint generation", () => {
    it("should use stored fingerprint if available", async () => {
      mockLocalStorage.getItem.mockReturnValue("stored-fingerprint");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            remaining: 10000,
            limit: 10000,
            reset: Date.now() + 3600000,
            resetIn: 3600,
            canProvideFeedback: true,
          }),
      });

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("miso-fingerprint");
      expect(result.current.fingerprint).toBe("stored-fingerprint");
    });

    it("should generate and store new fingerprint if not available", async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            remaining: 10000,
            limit: 10000,
            reset: Date.now() + 3600000,
            resetIn: 3600,
            canProvideFeedback: true,
          }),
      });

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "miso-fingerprint",
        expect.any(String),
      );
      expect(result.current.fingerprint).toBeTruthy();
    });
  });

  describe("fetchStatus", () => {
    it("should fetch status on mount", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-fp");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            remaining: 5000,
            limit: 10000,
            reset: Date.now() + 1800000,
            resetIn: 1800,
            canProvideFeedback: true,
          }),
      });

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.status).not.toBeNull();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/rate-limit/status",
        expect.objectContaining({
          headers: { "x-fingerprint": "test-fp" },
        }),
      );
      expect(result.current.status?.remaining).toBe(5000);
    });

    it("should set isLimited when remaining is 0", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-fp");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            remaining: 0,
            limit: 10000,
            reset: Date.now() + 1800000,
            resetIn: 1800,
            canProvideFeedback: true,
          }),
      });

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.isLimited).toBe(true);
      });
    });

    it("should handle fetch errors gracefully", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-fp");
      mockFetch.mockRejectedValue(new Error("Network error"));

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      // Should not throw — fetch was called but error was silently caught
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(result.current.status).toBeNull();
    });
  });

  describe("handleRateLimitError", () => {
    it("should show modal when rate limit error occurs", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-fp");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            remaining: 10000,
            limit: 10000,
            reset: Date.now() + 3600000,
            resetIn: 3600,
            canProvideFeedback: true,
          }),
      });

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.status).not.toBeNull();
      });

      act(() => {
        result.current.handleRateLimitError({
          error: "rate_limit",
          type: "tokens",
          message: "Token limit exceeded",
          reset: Date.now() + 1800000,
          remaining: 0,
          limit: 10000,
        });
      });

      expect(result.current.isLimited).toBe(true);
      expect(result.current.showModal).toBe(true);
      expect(result.current.error?.type).toBe("tokens");
    });

    it("should update status when token error received", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-fp");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            remaining: 5000,
            limit: 10000,
            reset: Date.now() + 3600000,
            resetIn: 3600,
            canProvideFeedback: true,
          }),
      });

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.status?.remaining).toBe(5000);
      });

      const newReset = Date.now() + 1800000;
      act(() => {
        result.current.handleRateLimitError({
          error: "rate_limit",
          type: "tokens",
          message: "Token limit exceeded",
          reset: newReset,
          remaining: 100,
          limit: 10000,
        });
      });

      expect(result.current.status?.remaining).toBe(100);
      expect(result.current.status?.reset).toBe(newReset);
    });
  });

  describe("submitFeedback", () => {
    it("should submit feedback and update status on success", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-fp");
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              remaining: 0,
              limit: 10000,
              reset: Date.now() + 3600000,
              resetIn: 3600,
              canProvideFeedback: true,
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              message: "You've been granted 5,000 bonus tokens!",
              newRemaining: 5000,
            }),
        });

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.status).not.toBeNull();
      });

      let feedbackResult: { success: boolean; message: string } | undefined;
      await act(async () => {
        feedbackResult = await result.current.submitFeedback(8);
      });

      expect(feedbackResult?.success).toBe(true);
      expect(feedbackResult?.message).toContain("5,000");
      expect(result.current.status?.remaining).toBe(5000);
      expect(result.current.status?.canProvideFeedback).toBe(false);
    });

    it("should handle feedback submission failure", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-fp");
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              remaining: 0,
              limit: 10000,
              reset: Date.now() + 3600000,
              resetIn: 3600,
              canProvideFeedback: false,
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              success: false,
              message: "You've already received bonus tokens this period.",
              newRemaining: 0,
            }),
        });

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.status).not.toBeNull();
      });

      let feedbackResult: { success: boolean; message: string } | undefined;
      await act(async () => {
        feedbackResult = await result.current.submitFeedback(8);
      });

      expect(feedbackResult?.success).toBe(false);
      expect(feedbackResult?.message).toContain("already received");
    });

    it("should handle network errors during feedback submission", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-fp");
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              remaining: 0,
              limit: 10000,
              reset: Date.now() + 3600000,
              resetIn: 3600,
              canProvideFeedback: true,
            }),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.status).not.toBeNull();
      });

      let feedbackResult: { success: boolean; message: string } | undefined;
      await act(async () => {
        feedbackResult = await result.current.submitFeedback(8);
      });

      expect(feedbackResult?.success).toBe(false);
      expect(feedbackResult?.message).toContain("Network error");

      consoleSpy.mockRestore();
    });
  });

  describe("closeModal", () => {
    it("should close the modal", async () => {
      mockLocalStorage.getItem.mockReturnValue("test-fp");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            remaining: 10000,
            limit: 10000,
            reset: Date.now() + 3600000,
            resetIn: 3600,
            canProvideFeedback: true,
          }),
      });

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      await waitFor(() => {
        expect(result.current.status).not.toBeNull();
      });

      // Open modal via error
      act(() => {
        result.current.handleRateLimitError({
          error: "rate_limit",
          type: "tokens",
          message: "Limited",
          reset: Date.now() + 1800000,
        });
      });

      expect(result.current.showModal).toBe(true);

      // Close modal
      act(() => {
        result.current.closeModal();
      });

      expect(result.current.showModal).toBe(false);
    });
  });

  describe("getHeaders", () => {
    it("should return headers with fingerprint", async () => {
      mockLocalStorage.getItem.mockReturnValue("my-fingerprint");
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            remaining: 10000,
            limit: 10000,
            reset: Date.now() + 3600000,
            resetIn: 3600,
            canProvideFeedback: true,
          }),
      });

      const { useRateLimit } = await import("./useRateLimit");
      const { result } = renderHook(() => useRateLimit());

      const headers = result.current.getHeaders();

      expect(headers).toEqual({ "x-fingerprint": "my-fingerprint" });
    });
  });
});
