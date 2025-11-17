// Make sure this import path is correct for your project structure
import type { Message as MessageType } from "../hooks/useChat";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react"; // Example icons

interface MessageListProps {
  messages: MessageType[];
  isWaitingForResponse: boolean;
}

export default function Messages({
  messages,
  isWaitingForResponse,
}: MessageListProps) {
  // A small helper to check if the last message is an empty assistant one
  const isAssistantReplying =
    isWaitingForResponse &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant";

  return (
    <div className="space-y-4 p-4">
      {messages.map((message, index) => {
        const isUser = message.role === "user";

        // Don't render the last empty placeholder if the assistant is "replying"
        if (isAssistantReplying && index === messages.length - 1) {
          return null;
        }

        return (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3",
              isUser && "justify-end", // Align user messages to the right
            )}
          >
            {/* Icon */}
            {!isUser && (
              <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md select-none">
                <Bot className="h-5 w-5" />
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={cn(
                "rounded-lg p-3 text-sm",
                isUser
                  ? "bg-primary text-primary-foreground"
                  : // You can customize the assistant bubble color here
                    "bg-muted",
              )}
            >
              {/* You can add a Markdown renderer here later for better formatting */}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>

            {/* Icon for User */}
            {isUser && (
              <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md select-none">
                <User className="h-5 w-5" />
              </div>
            )}
          </div>
        );
      })}

      {/* Typing Indicator */}
      {isAssistantReplying && (
        <div className="flex items-start gap-3">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md select-none">
            <Bot className="h-5 w-5" />
          </div>
          <div className="bg-muted rounded-lg p-3 text-sm">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
