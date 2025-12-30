import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";

import { ChatInputForm } from "./ChatInputForm";
import Messages from "./Messages";
import QuickSelects from "./QuickSelects";
import { QUICK_SELECT_PROMPTS } from "@/data/prompts";
import { useChatSession } from "../hooks/useChatSesstion";
import { usePersona } from "@/context/PersonaProvider/hooks";

export default function ChatInterface() {
  const { messages, status, sendMessage } = useChatSession();

  const isChatEmpty = messages.length === 0;
  const isLoading = status === "submitted" || status === "streaming";
  const isWaitingForResponse = status === "submitted";

  const handleSendMessage = (content: string) => {
    sendMessage({
      role: "user",
      parts: [{ type: "text", text: content }],
    });
  };

  return (
    <div
      className={cn(
        isChatEmpty ? "justify-center" : "",
        "flex h-full w-screen flex-1 flex-col overflow-hidden py-4 sm:px-10 xl:max-w-2xl xl:px-0! 2xl:max-w-3xl",
      )}
    >
      {isChatEmpty ? (
        <EmptyChat
          messages={messages}
          isLoading={isLoading}
          isWaitingForResponse={isWaitingForResponse}
          sendMessage={handleSendMessage}
        />
      ) : (
        <WithMessage
          messages={messages}
          isLoading={isLoading}
          isWaitingForResponse={isWaitingForResponse}
          sendMessage={handleSendMessage}
        />
      )}
    </div>
  );
}

// Update the Type Definition to use the Vercel SDK Message type
type ChildProps = {
  messages: UIMessage[];
  isLoading: boolean;
  isWaitingForResponse: boolean;
  sendMessage: (message: string) => void;
};

function WithMessage({
  messages,
  isLoading,
  isWaitingForResponse,
  sendMessage,
}: ChildProps) {
  return (
    <>
      <div className={cn("custom-scrollbar flex-1 overflow-y-scroll")}>
        {/* Ensure your Messages component can handle the 'Message' type from 'ai' */}
        <Messages
          messages={messages}
          isWaitingForResponse={isWaitingForResponse}
        />
      </div>

      <div className="px-4">
        {/* Passing the bridge function here */}
        <ChatInputForm onSend={sendMessage} isLoading={isLoading} />
      </div>
    </>
  );
}

function EmptyChat({ isLoading, sendMessage }: ChildProps) {
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
