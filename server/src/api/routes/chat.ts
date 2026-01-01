import { Router, Request, Response } from "express";
import { streamText, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { buildSystemPrompt } from "../../personas";
import { searchRecipesTool } from "../../tools/searchRecipes";
import { findRestaurantsTool } from "../../tools/findRestaurants";

const router = Router();

export default (app: Router) => {
  app.use("/chat", router);

  router.post("/stream", async (req: Request, res: Response) => {
    try {
      const { messages, userLocalTime, personaId } = req.body;

      const systemPrompt = buildSystemPrompt(
        personaId || "assistant-miso",
        userLocalTime
      );

      const result = streamText({
        // model: mockModel,
        model: anthropic("claude-haiku-4-5"),
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        tools: {
          searchRecipes: searchRecipesTool,
          findRestaurant: findRestaurantsTool,
        },
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
