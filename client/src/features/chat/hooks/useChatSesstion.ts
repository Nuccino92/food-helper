import { usePersona } from "@/context/PersonaProvider/hooks";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useCallback, useMemo } from "react";
import { useRateLimit, type RateLimitError } from "./useRateLimit";

// Extract recipe IDs from a message's tool invocations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractRecipeIdsFromMessage(message: any): number[] {
  if (!message.parts) return [];

  const ids: number[] = [];
  for (const part of message.parts) {
    // Check for tool invocation parts
    if (
      part.type === "tool-invocation" ||
      part.type === "tool-searchRecipes" ||
      part.toolInvocation?.toolName === "searchRecipes"
    ) {
      const data = part.output || part.result || part.toolInvocation?.result;
      if (data?.success && data?.recipe?.id) {
        // Single recipe format
        ids.push(data.recipe.id);
      }
    }
  }
  return ids;
}

export function useChatSession() {
  const { persona } = usePersona();
  const [seenRecipeIds, setSeenRecipeIds] = useState<number[]>([]);

  // Rate limiting
  const rateLimit = useRateLimit();

  // Create transport with dynamic body that includes seenRecipeIds
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${import.meta.env.VITE_API_URL}/chat/stream`,
        headers: rateLimit.getHeaders(),
        body: {
          userLocalTime: new Date().toLocaleString(),
          personaId: persona ?? null,
          seenRecipeIds,
        },
      }),
    [persona, seenRecipeIds, rateLimit],
  );

  const chat = useChat({
    transport,
    experimental_throttle: 50,

    onError: (error) => {
      console.error("Chat Error:", error);

      // Check if this is a rate limit error
      // The error might be a Response object or contain the response
      if (error && typeof error === "object") {
        const errorObj = error as { message?: string };
        try {
          // Try to parse rate limit error from message
          if (errorObj.message?.includes("rate_limit")) {
            const parsed = JSON.parse(errorObj.message) as RateLimitError;
            rateLimit.handleRateLimitError(parsed);
            return;
          }
        } catch {
          // Not a JSON error, continue with normal error handling
        }
      }
    },

    onFinish: (message) => {
      console.log("✅ Stream finished:", message);

      // Refresh rate limit status after successful message
      rateLimit.fetchStatus();

      // Extract recipe IDs from the finished message and add to seen list
      const newIds = extractRecipeIdsFromMessage(message);
      if (newIds.length > 0) {
        setSeenRecipeIds((prev) => {
          const combined = [...prev, ...newIds];
          // Deduplicate
          return [...new Set(combined)];
        });
      }
    },
  });

  // Expose a way to reset seen recipes if needed
  const resetSeenRecipes = useCallback(() => {
    setSeenRecipeIds([]);
  }, []);

  return {
    ...chat,
    seenRecipeIds,
    resetSeenRecipes,
    rateLimit,
  };
}
