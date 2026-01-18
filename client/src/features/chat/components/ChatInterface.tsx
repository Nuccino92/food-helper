import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { useRef, useEffect } from "react";

import { ChatInputForm, type ImageData } from "./ChatInputForm";
import Messages from "./Messages";
import QuickSelects from "./QuickSelects";
import { RateLimitModal } from "./RateLimitModal";
import { QUICK_SELECT_PROMPTS } from "@/data/prompts";
import { useChatSession } from "../hooks/useChatSesstion";
import { usePersona } from "@/context/PersonaProvider/hooks";

export default function ChatInterface() {
  const { messages, status, sendMessage, rateLimit } = useChatSession();

  const isChatEmpty = messages.length === 0;
  const isLoading = status === "submitted" || status === "streaming";
  const isWaitingForResponse = status === "submitted";

  // Refs for scroll behavior
  const messageRefs = useRef<Map<string, HTMLElement>>(new Map());
  const lastUserMessageIdRef = useRef<string | null>(null);
  const lastAssistantMessageIdRef = useRef<string | null>(null);

  // Find the last user message ID
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");
  // Find the last assistant message
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");

  // Scroll to user message when a new one is added
  useEffect(() => {
    if (!lastUserMessage) return;

    // Only scroll if this is a new user message
    if (lastUserMessageIdRef.current === lastUserMessage.id) return;
    lastUserMessageIdRef.current = lastUserMessage.id;

    // Use setTimeout to ensure DOM has fully updated
    const timeoutId = setTimeout(() => {
      const messageEl = messageRefs.current.get(lastUserMessage.id);

      if (messageEl) {
        // Scroll the page so user message is at the top
        // The scroll-mt-16 on the message element handles the offset from header
        messageEl.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [lastUserMessage, lastUserMessage?.id]);

  // Scroll to bottom when a new assistant message appears
  useEffect(() => {
    if (!lastAssistantMessage) return;

    // Only scroll if this is a new assistant message
    if (lastAssistantMessageIdRef.current === lastAssistantMessage.id) return;
    lastAssistantMessageIdRef.current = lastAssistantMessage.id;

    // Use multiple frames to ensure content is fully rendered
    const scrollToBottom = () => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      });
    };

    // Keep scrolling until content stabilizes
    let lastHeight = 0;
    let stableCount = 0;
    const checkAndScroll = () => {
      const currentHeight = document.documentElement.scrollHeight;
      if (currentHeight !== lastHeight) {
        lastHeight = currentHeight;
        stableCount = 0;
        scrollToBottom();
      } else {
        stableCount++;
      }
      // Keep checking until height is stable for 3 frames
      if (stableCount < 3) {
        requestAnimationFrame(checkAndScroll);
      }
    };

    // Initial scroll after short delay to let typing indicator transition
    const timeoutId = setTimeout(() => {
      scrollToBottom();
      requestAnimationFrame(checkAndScroll);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [lastAssistantMessage, lastAssistantMessage?.id]);

  const handleSendMessage = (content: string, images?: ImageData[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];

    // Add images first (they appear above text in the message)
    // Using "file" type with mediaType and url fields - this is how the Vercel AI SDK
    // handles images via FileUIPart, which convertToModelMessages() properly converts
    if (images && images.length > 0) {
      for (const img of images) {
        parts.push({
          type: "file",
          mediaType: img.mimeType,
          url: img.base64, // Full data URL: "data:image/jpeg;base64,..."
        });
      }
    }

    // Add text if provided
    if (content.trim()) {
      parts.push({ type: "text", text: content });
    }

    if (parts.length > 0) {
      sendMessage({
        role: "user",
        parts,
      });
    }
  };

  return (
    <>
      <div
        className={cn(
          isChatEmpty ? "justify-center" : "",
          "flex min-h-[calc(100vh-var(--header-height))] w-full max-w-full flex-1 flex-col py-4 sm:px-10 xl:max-w-2xl xl:px-0! 2xl:max-w-3xl",
        )}
      >
        {isChatEmpty ? (
          <EmptyChat isLoading={isLoading} sendMessage={handleSendMessage} />
        ) : (
          <WithMessage
            messages={messages}
            isLoading={isLoading}
            isWaitingForResponse={isWaitingForResponse}
            sendMessage={handleSendMessage}
            messageRefs={messageRefs}
          />
        )}
      </div>

      {/* Rate Limit Modal - soft block, user can dismiss and browse previous messages */}
      <RateLimitModal
        isOpen={rateLimit.showModal}
        onClose={rateLimit.closeModal}
        resetTime={rateLimit.status?.reset ?? Date.now() + 3600000}
        canProvideFeedback={rateLimit.status?.canProvideFeedback ?? false}
        onFeedbackSubmit={rateLimit.submitFeedback}
      />
    </>
  );
}

// Update the Type Definition to use the Vercel SDK Message type
type ChildProps = {
  messages: UIMessage[];
  isLoading: boolean;
  isWaitingForResponse: boolean;
  sendMessage: (message: string, images?: ImageData[]) => void;
  messageRefs: React.MutableRefObject<Map<string, HTMLElement>>;
};

function WithMessage({
  messages,
  isLoading,
  isWaitingForResponse,
  sendMessage,
  messageRefs,
}: ChildProps) {
  return (
    <>
      <div className="flex-1">
        <Messages
          messages={messages}
          isWaitingForResponse={isWaitingForResponse}
          messageRefs={messageRefs}
        />
      </div>

      {/* Sticky input at the bottom */}
      <div className="from-background via-background sticky bottom-0 bg-linear-to-t to-transparent px-4 pt-6 pb-4">
        <ChatInputForm onSend={sendMessage} isLoading={isLoading} />
      </div>
    </>
  );
}

type EmptyChatProps = {
  isLoading: boolean;
  sendMessage: (message: string, images?: ImageData[]) => void;
};

function EmptyChat({ isLoading, sendMessage }: EmptyChatProps) {
  const { persona } = usePersona();

  const welcomeMessage = {
    "assistant-miso": "How may I help you?",
    "assistant-gordon": "Shall we find something edible?",
    "assistant-sancho": "Can we make this quick?",
  };

  return (
    <div className="flex h-full w-full items-center justify-center px-2">
      <div className="relative w-full -translate-y-[50%]">
        <div className="space-y-6">
          <p className="text-muted-foreground text-center text-3xl font-medium">
            {welcomeMessage[persona]}
          </p>
          {/* Quick selects also work with the bridge function */}
          <QuickSelects prompts={QUICK_SELECT_PROMPTS} onSelect={sendMessage} />
        </div>

        <div className="absolute left-1/2 w-full -translate-x-1/2 pt-4">
          <ChatInputForm onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
