import type { UIMessage } from "@ai-sdk/react";
import type { RefObject } from "react";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import ChatMessage from "./ChatMessage";

interface MessageListProps {
  messages: UIMessage[];
  isWaitingForResponse: boolean;
  onSendMessage: (message: string) => void;
  lastUserMessageRef: RefObject<HTMLDivElement | null>;
  contentEndRef: RefObject<HTMLDivElement | null>;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
}

export default function Messages({
  messages,
  isWaitingForResponse,
  onSendMessage,
  lastUserMessageRef,
  contentEndRef,
  messagesContainerRef,
}: MessageListProps) {
  const lastUserMessageIndex = messages.findLastIndex(
    (m) => m.role === "user",
  );

  // Check if the last message is from the user (no AI response yet)
  const isWaitingForAI =
    messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <div
      ref={messagesContainerRef}
      className="relative flex flex-col px-4"
    >
      {messages.map((message, index) => {
        const isLastUserMessage = index === lastUserMessageIndex;
        const isUser = message.role === "user";

        return (
          <Fragment key={message.id}>
            <div
              ref={isLastUserMessage ? lastUserMessageRef : undefined}
              className={cn(
                index > 0 && (isUser ? "mt-12" : "mt-6"),
              )}
            >
              <ChatMessage
                message={message}
                onSendMessage={onSendMessage}
              />
            </div>

            {/* Typing indicator */}
            {isLastUserMessage && isWaitingForAI && isWaitingForResponse && (
              <article className="mt-6 flex items-start gap-4">
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

      {/* Content end sentinel */}
      <div ref={contentEndRef} className="h-0" />
    </div>
  );
}
