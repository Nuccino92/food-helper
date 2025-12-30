export type Persona =
  | "assistant-miso"
  | "assistant-gordon"
  | "assistant-sancho";

export interface PersonaProviderProps {
  children: React.ReactNode;
  defaultPersona?: Persona;
  storageKey?: string;
}
