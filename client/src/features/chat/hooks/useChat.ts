import { useState, useRef, useEffect } from "react";
import { streamChatSse } from "../api/streamChat";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

type ChatStatus = "idle" | "connecting" | "streaming" | "error";

export const useChat = (initialMessages: Message[] = []) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  // A ref to hold the cleanup function for the EventSource connection
  const cleanupRef = useRef<(() => void) | null>(null);

  // Use a ref to track the current status inside callbacks to avoid stale state
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Effect to clean up the connection if the component unmounts during a stream
  useEffect(() => {
    // This is the cleanup function that React will call on unmount
    return () => {
      if (cleanupRef.current) {
        console.log("Component unmounting, closing SSE connection.");
        cleanupRef.current();
      }
    };
  }, []);

  const sendMessage = (messageContent: string) => {
    if (!messageContent.trim() || status !== "idle") return;

    setStatus("connecting");
    setError(null);

    const newUserMessage: Message = { role: "user", content: messageContent };
    const messagesForApi = [...messages, newUserMessage];

    // Optimistically update UI with user message and an empty assistant placeholder
    setMessages((prev) => [
      ...prev,
      newUserMessage,
      { role: "assistant", content: "" },
    ]);

    // Start the SSE stream and store the cleanup function
    cleanupRef.current = streamChatSse({
      messages: messagesForApi,
      onDelta: (chunk) => {
        // On the VERY FIRST chunk, we transition from connecting to streaming
        if (statusRef.current === "connecting") {
          setStatus("streaming");
        }

        // This callback updates the assistant's message with each new chunk
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          const updatedLastMessage = {
            ...lastMessage,
            content: lastMessage.content + chunk,
          };
          return [...prev.slice(0, -1), updatedLastMessage];
        });
      },
      onComplete: () => {
        // The stream finished successfully
        setStatus("idle");
        cleanupRef.current = null; // Clear the ref since the connection is closed
      },
      onError: (err) => {
        // An error occurred
        setError(err);
        setStatus("error");
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          const updatedLastMessage = {
            ...lastMessage,
            content: "Sorry, an error occurred. Please try again.",
          };
          return [...prev.slice(0, -1), updatedLastMessage];
        });
        cleanupRef.current = null;
      },
    });
  };

  return {
    messages,
    isLoading: status === "connecting" || status === "streaming",
    isWaitingForResponse: status === "connecting",
    isStreaming: status === "streaming",
    error,
    sendMessage,
  };
};
