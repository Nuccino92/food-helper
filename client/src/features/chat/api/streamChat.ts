import {
  EventStreamContentType,
  fetchEventSource,
} from "@microsoft/fetch-event-source";
import type { Message } from "../hooks/useChat";

class FatalError extends Error {}
class RetriableError extends Error {}

export interface StreamChatParams {
  messages: Message[];
  onDelta: (chunk: string) => void;
  onComplete: (reason: string) => void;
  onError: (error: Error) => void;
}

/**
 * Establishes a resilient SSE connection using @microsoft/fetch-event-source.
 * This supports POST requests, custom headers, and automatic reconnection.
 * @returns A cleanup function to abort the connection.
 */
export const streamChatSse = ({
  messages,
  onDelta,
  onComplete,
  onError,
}: StreamChatParams): (() => void) => {
  const controller = new AbortController();

  fetchEventSource(`${import.meta.env.VITE_API_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ messages }),
    signal: controller.signal,

    // This is called when a message is received from the server
    onmessage(event) {
      if (event.event === "delta") {
        const data = JSON.parse(event.data);
        onDelta(data.text);
      } else if (event.event === "end") {
        const data = JSON.parse(event.data);
        onComplete(data.reason);
        // We can close the connection from the client side after the 'end' event
        controller.abort();
      }
    },

    // This is called when the connection is opened
    async onopen(response) {
      if (
        response.ok &&
        response.headers.get("content-type") === EventStreamContentType
      ) {
        return; // everything's good
      } else if (
        response.status >= 400 &&
        response.status < 500 &&
        response.status !== 429
      ) {
        // client-side errors are usually non-retriable:
        throw new FatalError();
      } else {
        throw new RetriableError();
      }
    },

    // This is called when the connection is closed
    onclose() {
      // if the server closes the connection unexpectedly, retry:
      throw new RetriableError();
    },

    // This is called when an error occurs
    onerror(err) {
      if (err instanceof FatalError) {
        onError(err);
      } else {
        // do nothing to automatically retry. You can also
        // return a specific retry interval here.
      }
    },
  });

  // Return the abort function for cleanup
  return () => {
    controller.abort();
  };
};
