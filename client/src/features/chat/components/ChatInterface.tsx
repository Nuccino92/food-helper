import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { ArrowDown } from "lucide-react";

import { ChatInputForm, type ImageData } from "./ChatInputForm";
import Messages from "./Messages";
import QuickSelects from "./QuickSelects";
import { RateLimitModal } from "./RateLimitModal";
import { QUICK_SELECT_PROMPTS } from "@/data/prompts";
import { useChatSession } from "../hooks/useChatSesstion";
import { useChatScroll } from "../hooks/useScrollToBottom";
import { usePersona } from "@/context/PersonaProvider/hooks";

export default function ChatInterface() {
  const { messages, status, sendMessage, rateLimit } = useChatSession();

  const isChatEmpty = messages.length === 0;
  const isLoading = status === "submitted" || status === "streaming";
  const isWaitingForResponse = status === "submitted";

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
            status={status}
            isLoading={isLoading}
            isWaitingForResponse={isWaitingForResponse}
            sendMessage={handleSendMessage}
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
  status: string;
  isLoading: boolean;
  isWaitingForResponse: boolean;
  sendMessage: (message: string, images?: ImageData[]) => void;
};

function WithMessage({
  messages,
  status,
  isLoading,
  isWaitingForResponse,
  sendMessage,
}: ChildProps) {
  const {
    lastUserMessageRef,
    contentEndRef,
    messagesContainerRef,
    showScrollButton,
    scrollToBottom,
  } = useChatScroll(messages, status);

  return (
    <>
      <div className="flex-1">
        <Messages
          messages={messages}
          isWaitingForResponse={isWaitingForResponse}
          onSendMessage={(msg: string) => sendMessage(msg)}
          lastUserMessageRef={lastUserMessageRef}
          contentEndRef={contentEndRef}
          messagesContainerRef={messagesContainerRef}
        />
      </div>

      {/* Fixed input - completely out of document flow */}
      <div className="chat-input-area fixed inset-x-0 bottom-0 z-10">
        <div className="mx-auto w-full max-w-full sm:px-10 xl:max-w-2xl xl:px-0! 2xl:max-w-3xl">
          <div className="from-background via-background bg-linear-to-t to-transparent px-4 pt-6 pb-4">
            <ChatInputForm onSend={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="border-border bg-background text-muted-foreground hover:text-foreground fixed bottom-28 right-6 z-20 flex size-10 items-center justify-center rounded-full border shadow-lg transition-colors"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="size-5" />
        </button>
      )}
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
    "assistant-miso": "Stuck on what to eat? Let's figure it out!",
    "assistant-gordon": "Can't decide? Let me elevate your choice.",
    "assistant-sancho":
      "Another one who can't pick... Let's get this over with.",
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
