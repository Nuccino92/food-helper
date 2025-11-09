// A library of pre-written responses for Miso
const MISO_RESPONSES: { [key: string]: string } = {
  default:
    "Ah, monsieur, an excellent question! Allow me a moment to ponder the perfect culinary delight for you. Are we feeling something light and healthy, or perhaps rich and comforting this evening?",
  burger:
    "An exquisite choice! For the Black Bean Burger, you will want a recipe that emphasizes a smoky paprika and a touch of cumin. Serve it on a toasted brioche bun with a spicy aioli. Voilà, perfection!",
  healthy:
    "For a healthy yet satisfying option, I would recommend a Mediterranean Quinoa Salad. It is vibrant, full of fresh vegetables, and the lemon-herb vinaigrette is simply divine. It provides wonderful energy without feeling heavy.",
};

/**
 * Simulates a streaming API call.
 * @param message The user's message to conditionally select a response.
 * @param onChunk A callback function that will be called with each new chunk of the response.
 * @param onComplete A callback function that will be called when the stream is finished.
 */
const mockStreamChat = (
  message: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
): void => {
  let response = MISO_RESPONSES.default;
  const lowerCaseMessage = message.toLowerCase();

  if (lowerCaseMessage.includes("burger")) {
    response = MISO_RESPONSES.burger;
  } else if (lowerCaseMessage.includes("healthy")) {
    response = MISO_RESPONSES.healthy;
  }

  const words = response.split(" ");
  let wordIndex = 0;

  const intervalId = setInterval(() => {
    if (wordIndex < words.length) {
      const chunk = words[wordIndex] + " ";
      onChunk(chunk); // "Send" the next word
      wordIndex++;
    } else {
      clearInterval(intervalId); // Stop the interval when done
      onComplete(); // Signal that the stream has finished
    }
  }, 75); // Adjust timing to feel natural (75ms is a good starting point)
};

import { useState } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export const useChat = (initialMessages: Message[] = []) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = async (messageContent: string) => {
    setIsLoading(true);
    setError(null);

    // 1. Add the user's message to the state
    const newUserMessage: Message = { role: "user", content: messageContent };
    setMessages((prev) => [...prev, newUserMessage]);

    // 2. Add a placeholder for the assistant's streaming response
    let assistantResponse = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    // 3. Call the MOCK streaming function
    mockStreamChat(
      messageContent,
      (chunk) => {
        // This is called for every word
        assistantResponse += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = assistantResponse;
          return newMessages;
        });
      },
      () => {
        // This is called when the stream is complete
        setIsLoading(false);
      },
    );
  };

  return { messages, isLoading, error, sendMessage };
};
