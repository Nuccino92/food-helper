import type { Message as MessageType } from "../api";

interface MessageListProps {
  messages: MessageType[];
  isLoading: boolean;
}

export default function Messages({ messages, isLoading }: MessageListProps) {
  return <div>content</div>;
}
