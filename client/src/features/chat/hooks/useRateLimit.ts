import { useState, useCallback, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

// Generate a simple fingerprint from browser characteristics
function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ];

  // Simple hash function
  const str = components.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Store fingerprint in localStorage to persist across sessions
function getOrCreateFingerprint(): string {
  const stored = localStorage.getItem("miso-fingerprint");
  if (stored) return stored;

  const fingerprint = generateFingerprint();
  localStorage.setItem("miso-fingerprint", fingerprint);
  return fingerprint;
}

export type RateLimitStatus = {
  remaining: number;
  limit: number;
  reset: number;
  resetIn: number;
  canProvideFeedback: boolean;
};

export type RateLimitError = {
  error: "rate_limit";
  type: "burst" | "tokens";
  message: string;
  reset: number;
  remaining?: number;
  limit?: number;
};

export function useRateLimit() {
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [isLimited, setIsLimited] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<RateLimitError | null>(null);

  const fingerprint = getOrCreateFingerprint();

  // Fetch current rate limit status from server
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/rate-limit/status`, {
        headers: {
          "x-fingerprint": fingerprint,
        },
      });

      if (response.ok) {
        const data: RateLimitStatus = await response.json();
        setStatus(data);
        setIsLimited(data.remaining <= 0);
        return data;
      }
    } catch {
      // Silently fail - rate limit status is non-critical
    }
    return null;
  }, [fingerprint]);

  // Handle rate limit error from chat endpoint
  const handleRateLimitError = useCallback((rateLimitError: RateLimitError) => {
    setError(rateLimitError);
    setIsLimited(true);
    setShowModal(true);

    if (rateLimitError.type === "tokens") {
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              remaining: rateLimitError.remaining ?? 0,
              reset: rateLimitError.reset,
            }
          : null,
      );
    }
  }, []);

  // Submit feedback and receive bonus tokens
  const submitFeedback = useCallback(
    async (
      score: number,
    ): Promise<{
      success: boolean;
      message: string;
      newRemaining?: number;
    }> => {
      try {
        const response = await fetch(`${API_URL}/rate-limit/feedback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-fingerprint": fingerprint,
          },
          body: JSON.stringify({ score }),
        });

        const data = await response.json();

        if (data.success) {
          // Update local status with new remaining tokens
          setStatus((prev) =>
            prev
              ? {
                  ...prev,
                  remaining: data.newRemaining,
                  canProvideFeedback: false,
                }
              : null,
          );
          setIsLimited(data.newRemaining <= 0);

          if (data.newRemaining > 0) {
            setShowModal(false);
          }
        }

        return data;
      } catch {
        return { success: false, message: "Network error. Please try again." };
      }
    },
    [fingerprint],
  );

  // Close modal
  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get headers to include with chat requests
  const getHeaders = useCallback(
    () => ({
      "x-fingerprint": fingerprint,
    }),
    [fingerprint],
  );

  // Check status on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    isLimited,
    showModal,
    error,
    fingerprint,
    fetchStatus,
    handleRateLimitError,
    submitFeedback,
    closeModal,
    clearError,
    getHeaders,
  };
}
