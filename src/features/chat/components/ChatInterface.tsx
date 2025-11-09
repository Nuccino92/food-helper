import { useChat } from "../api";
import { ChatInputForm } from "./ChatInputForm";
import Messages from "./Messages";

export default function ChatInterface() {
  const { messages, isLoading, sendMessage } = useChat();

  return (
    <div className="flex h-full w-screen flex-1 flex-col overflow-hidden py-4 2xl:max-w-3xl">
      <div className="flex-1 overflow-y-auto">
        <Messages messages={messages} isLoading={isLoading} />
      </div>
      <ChatInputForm onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
