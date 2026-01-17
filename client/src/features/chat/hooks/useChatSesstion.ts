import { usePersona } from "@/context/PersonaProvider/hooks";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useCallback, useMemo } from "react";

// Extract recipe IDs from a message's tool invocations
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

  // Create transport with dynamic body that includes seenRecipeIds
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${import.meta.env.VITE_API_URL}/chat/stream`,
        body: {
          userLocalTime: new Date().toLocaleString(),
          personaId: persona ?? null,
          seenRecipeIds,
        },
      }),
    [persona, seenRecipeIds]
  );

  const chat = useChat({
    transport,
    experimental_throttle: 50,

    onError: (error) => {
      console.error("Chat Error:", error);
    },

    onFinish: (message) => {
      console.log("✅ Stream finished:", message);

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
  };
}
