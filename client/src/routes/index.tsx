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
      className={`aura-${persona} flex h-screen w-screen flex-col items-center`}
    >
      <Header />
      <ChatInterface key={persona} />
    </div>
  );
}
