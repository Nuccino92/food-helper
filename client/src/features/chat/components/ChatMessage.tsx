import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import type { UIMessage } from "@ai-sdk/react";
import { RecipeCard } from "./RecipeCard";
import { MessageImages } from "./MessageImage";

interface ChatMessageProps {
  message: UIMessage;
  isFirstMessage: boolean;
}

const ChatMessage = memo(function ChatMessage({
  message,
  isFirstMessage,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  // 1. EXTRACT TEXT
  const content = message.parts
    ? message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("")
    : "";

  // 2. EXTRACT IMAGES (from "file" type parts with image mediaTypes)

  const imageParts =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message.parts?.filter((part: any) => {
      // Handle FileUIPart format (type: "file" with image mediaType)
      if (part.type === "file" && part.mediaType?.startsWith("image/")) {
        return true;
      }
      // Also handle legacy "image" type just in case
      if (part.type === "image") {
        return true;
      }
      return false;
    }) || [];
  const images = imageParts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((part: any) => ({
      // FileUIPart uses 'url' field, ImagePart uses 'image' field
      url:
        part.url ||
        part.image ||
        (typeof part.data === "string" ? part.data : ""),
      alt: "Uploaded image",
    }))
    .filter((img: { url: string }) => img.url);

  // 3. EXTRACT RECIPES
  // We scan 'parts' directly because your JSON shows the data lives there
  // under 'output', not 'result'.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolParts = message.parts?.filter((part: any) => {
    // Check for standard SDK 'tool-invocation' OR your specific 'tool-searchRecipes' type
    return (
      part.type === "tool-invocation" ||
      part.type === "tool-searchRecipes" ||
      (part.toolInvocation && part.toolInvocation.toolName === "searchRecipes")
    );
  });

  return (
    <article
      className={cn(
        "flex flex-col gap-2 transition-all",
        isUser ? "ml-auto max-w-[85%] items-end" : "w-full items-start",
        !isFirstMessage && isUser && "mt-12",
      )}
    >
      {/* USER IMAGES */}
      {isUser && images.length > 0 && <MessageImages images={images} />}

      {/* RECIPE CARD (above text for assistant messages) */}
      {!isUser &&
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        toolParts?.map((part: any, index: number) => {
          // 1. Normalize Data
          const data =
            part.output || part.result || part.toolInvocation?.result;
          const args = part.input || part.args || part.toolInvocation?.args;

          // 2. SAFETY CHECK: If the tool is still loading (no data yet), ignore.
          if (!data) return null;

          // 3. ERROR HANDLING: If the tool finished but found nothing
          if (data.success === false || !data.recipe) {
            return (
              <div
                key={index}
                className="bg-muted/50 border-muted-foreground/25 text-muted-foreground mb-3 flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm"
              >
                <span className="text-xl">🤷‍♂️</span>
                <div>
                  <p className="text-foreground font-semibold">Nothing found</p>
                  <p className="text-xs opacity-80">
                    {`Couldn't find any recipes for "${args?.query}". Try asking me to search for something else!`}
                  </p>
                </div>
              </div>
            );
          }

          // 4. SUCCESS STATE: Render the single recipe card
          return (
            <RecipeCard key={part.toolCallId || index} recipe={data.recipe} />
          );
        })}

      {/* TEXT BUBBLE */}
      {content && (
        <div
          className={cn(
            "rounded-3xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground pr-8",
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
      )}
    </article>
  );
});

export default ChatMessage;
