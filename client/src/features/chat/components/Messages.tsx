import type { UIMessage } from "@ai-sdk/react";
import { useCallback, Fragment, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import { cn } from "@/lib/utils"; // Assuming you have this, otherwise use standard string concat

interface MessageListProps {
  messages: UIMessage[];
  isWaitingForResponse: boolean;
  messageRefs: React.RefObject<Map<string, HTMLElement>>;
}

export default function Messages({
  messages,
  isWaitingForResponse,
  messageRefs,
}: MessageListProps) {
  // 1. Callback ref to register message elements
  const setMessageRef = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element) {
        messageRefs.current?.set(id, element);
      } else {
        messageRefs.current?.delete(id);
      }
    },
    [messageRefs],
  );

  // 2. Scroll Effect: When a new User message is added, snap it to the top
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.role === "user") {
      const element = messageRefs.current?.get(lastMessage.id);
      if (element) {
        // block: 'start' aligns the top of the element with the top of the visible area
        element.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }
  }, [messages.length, messages, messageRefs]);

  // Find the last user message index
  const lastUserMessageIndex = messages.findLastIndex((m) => m.role === "user");

  // Check if the last message is from the user (no AI response yet)
  const isWaitingForAI =
    messages.length > 0 && messages[messages.length - 1].role === "user";

  // This calculates the minimum height the AI response needs to be to fill the screen
  const FILL_SCREEN_CLASS = "min-h-[calc(100vh-21rem)]";

  return (
    <div className="overflow-anchor-none relative flex flex-col space-y-6 px-4 pb-4">
      {messages.map((message, index) => {
        const isLastUserMessage = index === lastUserMessageIndex;
        const isLastMessage = index === messages.length - 1;

        // If this is the very last message and it is from the Assistant,
        // make it fill the remaining screen height.
        const shouldFillScreen = isLastMessage && message.role === "assistant";

        return (
          <Fragment key={message.id}>
            <div className={cn(shouldFillScreen ? FILL_SCREEN_CLASS : "")}>
              <ChatMessage
                message={message}
                isFirstMessage={index === 0}
                setRef={(el) => setMessageRef(message.id, el)}
              />
            </div>

            {/* Typing indicator: If visible, THIS becomes the filler element */}
            {isLastUserMessage && isWaitingForAI && isWaitingForResponse && (
              <article
                className={cn(
                  "flex items-start gap-4",
                  FILL_SCREEN_CLASS, // Apply filler height to loader if waiting
                )}
              >
                <div className="rounded-lg p-4 text-sm">
                  <div className="typing-indicator flex gap-1">
                    <span className="animate-bounce delay-0"></span>
                    <span className="animate-bounce delay-150"></span>
                    <span className="animate-bounce delay-300"></span>
                  </div>
                </div>
              </article>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
