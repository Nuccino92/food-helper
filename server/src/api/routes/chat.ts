import { Router, Request, Response } from "express";
import { streamText, convertToModelMessages, simulateReadableStream } from "ai";
import { MockLanguageModelV3 } from "ai/test";

const router = Router();

// 1. Mock Model Definition
const mockModel = new MockLanguageModelV3({
  modelId: "mock-test-model",
  doStream: async () => {
    const responseText =
      "Of course! Based on your ingredients, here is a great recipe:\n\n# 🐔 Classic Chicken & Pepper Stir-Fry\n\n**Ingredients Needed:**\n- 1 lb Chicken breast (cubed)\n- 2 Bell peppers (sliced)\n- Soy sauce & garlic\n\n**Instructions:**\n1. Heat oil in a pan over medium-high heat.\n2. Add the **chicken** and cook until golden brown.\n3. Toss in the peppers and stir-fry for 3-4 minutes.\n4. Pour in the sauce and serve over rice.\n\nEnjoy your meal!";

    // Split text into chunks
    const textChunks = responseText.split(/(?=[ ])|(?<=[ ])/g);

    // Build chunks array in the format simulateReadableStream expects
    const chunks: any[] = [{ type: "text-start", id: "text-1" }];

    for (const chunk of textChunks) {
      chunks.push({ type: "text-delta", id: "text-1", delta: chunk });
    }

    chunks.push(
      { type: "text-end", id: "text-1" },
      {
        type: "finish",
        finishReason: "stop",
        logprobs: undefined,
        usage: { inputTokens: 10, outputTokens: 100, totalTokens: 110 },
      }
    );

    return {
      stream: simulateReadableStream({
        chunks,
        chunkDelayInMs: 20,
      }),
      rawCall: { rawPrompt: null, rawSettings: {} },
    };
  },
});

export default (app: Router) => {
  app.use("/chat", router);

  router.post("/stream", async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;

      const result = streamText({
        model: mockModel,
        messages: await convertToModelMessages(messages),
      });

      const response = result.toUIMessageStreamResponse();

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }

      res.end();
    } catch (error) {
      console.error("Error:", error);
      if (!res.headersSent) res.status(500).end();
    }
  });
};
