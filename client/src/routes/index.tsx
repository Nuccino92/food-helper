import Header from "@/components/Header";
import ChatInterface from "@/features/chat/components/ChatInterface";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="dark:bg-muted/50 flex h-screen w-screen flex-col items-center">
      <Header />
      <ChatInterface />
    </div>
  );
}
