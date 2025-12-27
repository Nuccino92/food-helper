import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import type { UIMessage } from "@ai-sdk/react";

interface ChatMessageProps {
  message: UIMessage;
}

/**
 * A memoized component that renders a single chat message.
 * only if the props have changed. In our case, this means a message will only
 * re-render if its content is actively being updated (i.e., the streaming response).
 */
const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Extract text content from the message parts
  const content = message.parts
    .filter((part) => part.type === "text")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((part: any) => part.text)
    .join("");

  return (
    <article
      className={cn(
        "flex scroll-mt-16 items-start gap-4 transition-all",
        isUser && "justify-end",
      )}
    >
      <div
        className={cn(
          "rounded-lg p-4 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground",
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
});

export default ChatMessage;
