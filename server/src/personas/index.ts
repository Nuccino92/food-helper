// src/personas/index.ts
import { BASE_RULES } from "./base-rules";
import { misoPersona, gordonPersona } from "./personas";

const personas: Record<string, typeof misoPersona> = {
  miso: misoPersona,
  gordon: gordonPersona,
};

export function buildSystemPrompt(personaId: string, userLocalTime: string) {
  // Default to Miso if ID is not found
  const p = personas[personaId] || misoPersona;

  return `
   IDENTITY & ROLE:
    - **NAME:** ${p.name}
    - **ROLE:** ${p.role}
    
    ${p.tone}

    CONTEXT:
    - User's Local Time: ${userLocalTime || "Unknown"}
    - User's Location: Earth (Assume standard grocery availability)

    ${BASE_RULES}
  `;
}
