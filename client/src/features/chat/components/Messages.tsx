import type { UIMessage } from "@ai-sdk/react";
import { Fragment } from "react";
import ChatMessage from "./ChatMessage";

interface MessageListProps {
  messages: UIMessage[];
  isWaitingForResponse: boolean;
}

export default function Messages({
  messages,
  isWaitingForResponse,
}: MessageListProps) {
  // Find the last user message index
  const lastUserMessageIndex = messages.findLastIndex((m) => m.role === "user");

  // Check if the last message is from the user (no AI response yet)
  const isWaitingForAI =
    messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <div className="relative flex flex-col space-y-6 px-4 pb-4">
      {messages.map((message, index) => {
        const isLastUserMessage = index === lastUserMessageIndex;

        return (
          <Fragment key={message.id}>
            <div>
              <ChatMessage
                message={message}
                isFirstMessage={index === 0}
              />
            </div>

            {/* Typing indicator */}
            {isLastUserMessage && isWaitingForAI && isWaitingForResponse && (
              <article className="flex items-start gap-4">
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
