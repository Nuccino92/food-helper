import { useEffect, useRef, useState } from "react";
import type { Message } from "../hooks/useChat";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MessageListProps {
  messages: Message[];
  isWaitingForResponse: boolean;
}

const UI_OFFSET = 230;

export default function Messages({
  messages,
  isWaitingForResponse,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement>(null);
  const [lastUserMessageHeight, setLastUserMessageHeight] = useState(0);

  const isAssistantReplying =
    isWaitingForResponse &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant";

  // Find the last user message
  const lastUserMessageIndex = messages.findLastIndex((m) => m.role === "user");

  useEffect(() => {
    if (lastUserMessageRef.current) {
      const height = lastUserMessageRef.current.offsetHeight;
      setLastUserMessageHeight(height);
    }
  }, [messages]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [messages.length, isWaitingForResponse]);

  return (
    <div className="overflow-anchor-none flex flex-col space-y-6 px-4">
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const isLastMessage = index === messages.length - 1;
        const isLastUserMessage = index === lastUserMessageIndex;

        if (isAssistantReplying && isLastMessage) {
          return null;
        }

        const heightStyle =
          !isUser && isLastMessage
            ? {
                minHeight: `calc(100dvh - ${UI_OFFSET + lastUserMessageHeight + 24}px)`,
              }
            : undefined;

        return (
          <article
            key={index}
            ref={isLastUserMessage ? lastUserMessageRef : null}
            style={heightStyle}
            className={cn(
              "flex scroll-mt-16 items-start gap-4 transition-all",
              isUser && "justify-end",
            )}
          >
            {!isUser && (
              <div className="bg-primary text-primary-foreground mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md select-none">
                <Bot className="h-5 w-5" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[85%] rounded-lg p-4 text-sm leading-relaxed",
                isUser ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              <div
                className={cn(
                  "max-w-none",
                  !isUser && "prose dark:prose-invert",
                  isUser && "prose-invert text-base",
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>

            {isUser && (
              <div className="bg-muted mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md select-none">
                <User className="h-5 w-5" />
              </div>
            )}
          </article>
        );
      })}

      {isAssistantReplying && (
        <article
          style={{
            minHeight: `calc(100dvh - ${UI_OFFSET + lastUserMessageHeight + 24}px)`,
          }}
          className="flex items-start gap-4"
        >
          <div className="bg-primary text-primary-foreground mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md select-none">
            <Bot className="h-5 w-5" />
          </div>
          <div className="bg-muted rounded-lg p-4 text-sm">
            <div className="typing-indicator flex gap-1">
              <span className="animate-bounce delay-0"></span>
              <span className="animate-bounce delay-150"></span>
              <span className="animate-bounce delay-300"></span>
            </div>
          </div>
        </article>
      )}

      <div ref={bottomRef} className="mt-5 h-px w-full" />
    </div>
  );
}
