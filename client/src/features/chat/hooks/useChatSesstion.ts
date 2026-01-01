import { usePersona } from "@/context/PersonaProvider/hooks";
import { useChat } from "@ai-sdk/react";
// 1. Import the Transport class
import { DefaultChatTransport } from "ai";

export function useChatSession() {
  const { persona } = usePersona();

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: `${import.meta.env.VITE_API_URL}/chat/stream`,
      body: {
        userLocalTime: new Date().toLocaleString(),
        personaId: persona ?? null,
      },
    }),
    experimental_throttle: 50,

    onError: (error) => {
      console.error("Chat Error:", error);
    },

    onFinish: (message) => {
      console.log("✅ Stream finished:", message);
    },
  });

  return chat;
}
