import type { UIMessage } from "@ai-sdk/react";
import ChatMessage from "./ChatMessage";

interface MessageListProps {
  messages: UIMessage[];
  isWaitingForResponse: boolean;
}

export default function Messages({
  messages,
  isWaitingForResponse,
}: MessageListProps) {
  const isAssistantReplying =
    isWaitingForResponse &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant";

  return (
    <div className="overflow-anchor-none relative flex flex-col space-y-6 px-4">
      {messages.map((message) => {
        return <ChatMessage key={message.id} message={message} />;
      })}

      {isAssistantReplying && (
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
    </div>
  );
}
