import { useEffect, useState } from "react";
import type { Persona, PersonaProviderProps } from "./types";
import { PersonaProviderContext } from "./hooks";

export function PersonaProvider({
  children,
  defaultPersona = "assistant-miso",
  storageKey = "food-assistant-persona",
}: PersonaProviderProps) {
  const [persona, setPersona] = useState<Persona>(
    () => (localStorage.getItem(storageKey) as Persona) || defaultPersona,
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(
      "aura-assistant-miso",
      "aura-assistant-gordon",
      "aura-assistant-sancho",
    );
    root.classList.add(`aura-${persona}`);
  }, [persona]);

  const value = {
    persona,
    setPersona: (persona: Persona) => {
      localStorage.setItem(storageKey, persona);
      setPersona(persona);
    },
  };

  return (
    <PersonaProviderContext.Provider value={value}>
      {children}
    </PersonaProviderContext.Provider>
  );
}
