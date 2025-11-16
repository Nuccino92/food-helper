import { Message } from "../types/chat";

/**
 * Simulates a streaming response from an LLM.
 * It takes messages as input but ignores them for this mock.
 * @param messages - The conversation history (unused in mock).
 * @returns An async generator that yields text chunks.
 */
export async function* mockLlmStream(
  messages: Message[]
): AsyncGenerator<string> {
  // A simple mock response for your food app
  const mockResponse =
    "Of course! Based on what you have, a classic chicken and bell pepper stir-fry would be delicious. Here's a simple recipe to get you started...";

  // Split the response into words (chunks)
  const chunks = mockResponse.split(" ");

  // Yield each chunk with a small delay to simulate streaming
  for (const chunk of chunks) {
    // Add a space back to each chunk
    yield chunk + " ";

    // Wait for 50 milliseconds before sending the next chunk
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
