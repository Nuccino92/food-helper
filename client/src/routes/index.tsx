import Header from "@/components/Header";
import { usePersona } from "@/context/PersonaProvider/hooks";
import ChatInterface from "@/features/chat/components/ChatInterface";

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { persona } = usePersona();

  return (
    <div
      className={`aura-${persona} chat-page flex h-screen w-full flex-col items-center overflow-x-hidden overflow-y-auto`}
    >
      <Header className="sticky top-0 z-10 shrink-0" />
      <ChatInterface key={persona} />
    </div>
  );
}
