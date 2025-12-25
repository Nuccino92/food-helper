import { Message } from "../types/chat";

/**
 * Simulates a streaming response from an LLM.
 * It takes messages as input but ignores them for this mock.
 * @param messages - The conversation history (unused in mock).
 */

const MOCK_RESPONSE_PARTS = [
  // Chunk 1: Intro + Header (###)
  "Of course! Based on your ingredients, here is a great recipe:\n\n# 🐔 Classic Chicken & Pepper Stir-Fry\n\n",

  // Chunk 2: Bold text (**) and a bulleted list (-)
  "**Ingredients Needed:**\n- 1 lb Chicken breast (cubed)\n- 2 Bell peppers (sliced)\n- Soy sauce & garlic\n\n",

  // Chunk 3: Numbered list (1.) and some bolding inside the steps
  "**Instructions:**\n1. Heat oil in a pan over medium-high heat.\n2. Add the **chicken** and cook until golden brown.\n",

  // Chunk 4: The rest of the list and a closing statement
  "3. Toss in the peppers and stir-fry for 3-4 minutes.\n4. Pour in the sauce and serve over rice.\n\nEnjoy your meal!",
];

// Helper function to format messages in the SSE protocol
const formatSseEvent = (event: string, data: object): string => {
  const jsonData = JSON.stringify(data);
  return `event: ${event}\ndata: ${jsonData}\n\n`;
};

/**
 * Mocks a ChatGPT-style SSE stream with metadata and delta events.
 */
export async function* mockLlmSseStream(
  messages: Message[]
): AsyncGenerator<string> {
  // 1. Send an initial metadata event (like message_marker)
  yield formatSseEvent("metadata", {
    type: "message_marker",
    conversation_id: "mock-convo-123",
    message_id: "mock-msg-456",
  });
  await new Promise((resolve) => setTimeout(resolve, 10)); // Tiny delay

  // 2. Loop through each paragraph of our response
  for (const part of MOCK_RESPONSE_PARTS) {
    const words = part.split(" ");
    for (const word of words) {
      // 3. Send each word as a 'delta' event with a text payload
      const payload = { text: word + " " };
      yield formatSseEvent("delta", payload);

      // Short delay between words to simulate typing
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    // Longer delay between paragraphs to simulate thinking
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  // 4. Signal the end of the stream with a special 'end' event
  yield formatSseEvent("end", { reason: "stop" });
}
