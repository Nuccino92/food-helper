import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { createPortal } from "react-dom";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { UIMessage } from "@ai-sdk/react";

/**
 * TODO: figure out why its not scrolling properly after the 2nd message
 */

interface MessageListProps {
  messages: UIMessage[];
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

  const [showScrollButton, setShowScrollButton] = useState(false);

  const isAssistantReplying =
    isWaitingForResponse &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant";

  const lastUserMessageIndex = messages.findLastIndex((m) => m.role === "user");

  useEffect(() => {
    if (lastUserMessageRef.current) {
      const height = lastUserMessageRef.current.offsetHeight;
      setLastUserMessageHeight(height);
    }
  }, [messages]);

  // Scroll Detection Logic for scroll to bottom button
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      let scrollTop = 0;
      let scrollHeight = 0;
      let clientHeight = 0;

      if (target === document) {
        scrollTop = window.scrollY;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      } else {
        const el = target as HTMLElement;
        scrollTop = el.scrollTop;
        scrollHeight = el.scrollHeight;
        clientHeight = el.clientHeight;
      }

      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // Threshold 100px
      setShowScrollButton(distanceFromBottom > 100);
    };

    let scrollContainer: HTMLElement | Window = window;
    let parent = bottomRef.current?.parentElement;

    // Find scrollable parent
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        scrollContainer = parent;
        break;
      }
      parent = parent.parentElement;
    }

    scrollContainer.addEventListener("scroll", handleScroll);

    // Check initial state
    if (scrollContainer instanceof HTMLElement) {
      handleScroll({ target: scrollContainer } as unknown as Event);
    } else {
      handleScroll({ target: document } as unknown as Event);
    }

    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
    setShowScrollButton(false);
  };

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
    <div className="overflow-anchor-none relative flex flex-col space-y-6 px-4">
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const isLastMessage = index === messages.length - 1;
        const isLastUserMessage = index === lastUserMessageIndex;

        const content = message.parts
          .filter((part: { type: string }) => part.type === "text")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((part: any) => part.text)
          .join("");

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
              index !== 0 && isUser && "mt-12",
              "flex scroll-mt-16 items-start gap-4 transition-all",
              isUser && "justify-end",
            )}
          >
            <div
              className={cn(
                "rounded-lg p-4 text-sm leading-relaxed",
                isUser ? "bg-primary text-primary-foreground" : "",
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    code({ inline, className, children, ...props }: any) {
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
                  {content}
                </ReactMarkdown>
              </div>
            </div>
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
          <div className="rounded-lg p-4 text-sm">
            <div className="typing-indicator flex gap-1">
              <span className="animate-bounce delay-0"></span>
              <span className="animate-bounce delay-150"></span>
              <span className="animate-bounce delay-300"></span>
            </div>
          </div>
        </article>
      )}

      {/* Scroll Button */}
      {/* user portal to not interfere with dynamic heights*/}
      {typeof document !== "undefined" &&
        createPortal(
          <Button
            variant="default"
            size="icon"
            className={cn(
              "fixed bottom-28 left-1/2 z-50 rounded-full shadow-lg transition-all duration-300",
              "-translate-x-1/2",
              showScrollButton
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-10 opacity-0",
            )}
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>,
          document.body,
        )}

      <div ref={bottomRef} className="mt-5 h-px w-full" />
    </div>
  );
}
