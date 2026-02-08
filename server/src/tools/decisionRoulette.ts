import { tool } from "ai";
import { z } from "zod";

/**
 * DECISION ROULETTE TOOL
 * ----------------------
 * A visual randomizer for food decision paralysis.
 *
 * This tool is a pure pass-through: it sends the AI-generated options to the client,
 * which renders an interactive modal with a slot-machine-style animation.
 * The actual "pick" happens client-side during the animation — no server-side randomization.
 *
 * After the user spins, the result is sent back as a user message prefixed with
 * "[Roulette Result]" so the AI can follow up naturally (typically with a recipe search).
 */
export const decisionRouletteTool = tool({
  description: `
    Present a visual decision randomizer to help users who are genuinely stuck between multiple specific food options.
    The client renders an interactive spinning animation that picks one option at random.

    WHEN TO USE:
    - The user has named 2+ concrete food options and explicitly cannot choose ("I can't decide between tacos and pizza")
    - A group/family is split between specific foods ("My kids want burgers, I want sushi")
    - The user has been going back and forth between options for 2+ messages
    - The user explicitly asks you to pick for them, randomize, or "just decide"

    WHEN NOT TO USE:
    - The user is vague ("I don't know what to eat") — help them narrow down first
    - There's only one option — just confirm it
    - The user has a clear preference but wants validation — validate it
    - You haven't explored their preferences yet — do that first
    - You haven't tried making an opinionated recommendation yet — be the guide FIRST

    HOW TO USE:
    - Extract 2-6 concrete food options from the conversation context
    - Use short, recognizable names (e.g., "Tacos", "Pad Thai", "Burgers") — not full sentences
    - After calling this tool, frame the moment with ceremony in your persona's voice

    AFTER THE SPIN:
    - The user will send a message like "[Roulette Result] The randomizer picked: Tacos!"
    - Respond enthusiastically in your persona's voice
    - Default to calling searchRecipes for the picked food
    - EXCEPTION: If the conversation has established they want to order out/get takeout, call findRestaurant instead
    - If no cooking-vs-ordering context exists, default to recipe search
  `,

  inputSchema: z.object({
    options: z
      .array(z.string())
      .min(2)
      .max(6)
      .describe(
        "Array of 2-6 short food option names extracted from the conversation (e.g., ['Tacos', 'Pizza', 'Sushi'])"
      ),
  }),

  execute: async ({ options }: { options: string[] }) => {
    return {
      success: true,
      options,
    };
  },
});
