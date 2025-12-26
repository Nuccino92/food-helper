import { cn } from "@/lib/utils";

import { ChatInputForm } from "./ChatInputForm";
import Messages from "./Messages";
import QuickSelects from "./QuickSelects";
import { QUICK_SELECT_PROMPTS } from "@/data/prompts";
import { useChat, type Message as MessageType } from "../hooks/useChat";

export default function ChatInterface() {
  const { messages, isLoading, isWaitingForResponse, sendMessage } = useChat();

  const isChatEmpty = messages.length === 0;

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
          sendMessage={sendMessage}
        />
      ) : (
        <WithMessage
          messages={messages}
          isLoading={isLoading}
          isWaitingForResponse={isWaitingForResponse}
          sendMessage={sendMessage}
        />
      )}
    </div>
  );
}

type ChildProps = {
  messages: MessageType[];
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
      <div className={cn("custom-scrollbar flex-1 overflow-y-auto")}>
        <Messages
          messages={messages}
          isWaitingForResponse={isWaitingForResponse}
        />
      </div>

      <div className="px-4">
        <ChatInputForm onSend={sendMessage} isLoading={isLoading} />{" "}
      </div>
    </>
  );
}

function EmptyChat({ isLoading, sendMessage }: ChildProps) {
  return (
    <div className="flex h-full w-full items-center justify-center px-2">
      <div className="relative w-full -translate-y-[50%]">
        <div className="space-y-6">
          <p className="text-muted-foreground text-center text-3xl font-medium">
            How may I help you?
          </p>
          <QuickSelects prompts={QUICK_SELECT_PROMPTS} onSelect={sendMessage} />
        </div>

        <div className="absolute left-1/2 w-full -translate-x-1/2 pt-4">
          <ChatInputForm onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
