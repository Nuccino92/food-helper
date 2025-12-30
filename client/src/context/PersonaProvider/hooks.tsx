import { createContext, useContext } from "react";
import type { Persona } from "./types";

interface PersonaProviderState {
  persona: Persona;
  setPersona: (persona: Persona) => void;
}

export const PersonaProviderContext = createContext<
  PersonaProviderState | undefined
>(undefined);

export const usePersona = () => {
  const context = useContext(PersonaProviderContext);
  if (!context) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
};
