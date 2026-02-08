import { Router, Request, Response } from "express";
import { streamText, convertToModelMessages, tool, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { buildSystemPrompt } from "../../personas";
import { findRestaurantsTool } from "../../tools/findRestaurants";
import { createFlagAbuseTool } from "../../tools/flagAbuse";
import { decisionRouletteTool } from "../../tools/decisionRoulette";
import {
  checkAbuseLock,
  checkBurstLimit,
  checkTokenBudget,
  deductTokens,
  estimateTokens,
  generateIdentifier,
} from "../../services/rateLimit";

const router = Router();

export default (app: Router) => {
  app.use("/chat", router);

  router.post("/stream", async (req: Request, res: Response) => {
    try {
      const { messages, userLocalTime, personaId, seenRecipeIds = [] } = req.body;

      // --- Rate Limiting ---
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const fingerprint = req.headers["x-fingerprint"] as string | undefined;
      const identifier = generateIdentifier(ip, fingerprint);

      // 0. Abuse lock check (AI-triggered lockout)
      const abuseLock = await checkAbuseLock(identifier);
      if (abuseLock.locked) {
        res.status(429).json({
          error: "rate_limit",
          type: "tokens",
          message: "You've been temporarily locked out.",
          remaining: 0,
          limit: 10000,
          reset: abuseLock.reset,
        });
        return;
      }

      // 1. Burst protection (20 req/min)
      const burstCheck = await checkBurstLimit(identifier);
      if (!burstCheck.success) {
        res.status(429).json({
          error: "rate_limit",
          type: "burst",
          message: "Too many requests. Please slow down.",
          reset: burstCheck.reset,
        });
        return;
      }

      // 2. Estimate input tokens from the latest user message
      const latestMessage = messages[messages.length - 1];
      const inputText =
        typeof latestMessage?.content === "string"
          ? latestMessage.content
          : JSON.stringify(latestMessage?.content || "");
      const estimatedInputTokens = estimateTokens(inputText);

      // Add buffer for system prompt and expected response (~2000 tokens typical)
      const estimatedTotalTokens = estimatedInputTokens + 2000;

      // 3. Pre-check token budget
      const tokenCheck = await checkTokenBudget(identifier, estimatedTotalTokens);
      if (!tokenCheck.allowed) {
        res.status(429).json({
          error: "rate_limit",
          type: "tokens",
          message: "You've used your token budget for this hour.",
          remaining: tokenCheck.remaining,
          limit: tokenCheck.limit,
          reset: tokenCheck.reset,
        });
        return;
      }

      const systemPrompt = buildSystemPrompt(
        personaId || "assistant-miso",
        userLocalTime
      );

      // Create searchRecipes tool with seenRecipeIds context injected
      const searchRecipesWithContext = tool({
        description: `
          Call this tool when the user wants a recipe recommendation.

          YOU ARE A CONFIDENT RECOMMENDER - not a search engine.
          This tool returns ONE recipe that YOU choose as the best fit.

          YOUR JOB:
          1. Use the recipe data (title, readyInMinutes, healthScore, fullSummary) to understand the dish
          2. Write a compelling, personalized recommendation explaining WHY this dish fits their needs
          3. The recipe card will appear automatically below your text - don't describe the image or link
          4. End with an escape hatch like "Not feeling it? I can suggest something different."

          FRAMING HEALTH (don't show the score number):
          - healthScore 80+ → mention it's "lighter" or "pretty healthy"
          - healthScore 50-79 → say nothing about health
          - healthScore <50 → call it "indulgent" or "comfort food"

          FRAMING TIME:
          - <20 min → "super quick"
          - 20-40 min → "comes together fast"
          - 40-60 min → mention the time as worth it
          - >60 min → "a bit of a project but worth it"

          SORTING: Choose sort based on user context:
          - "quick dinner", "fast meal" → sort: "time", sortDirection: "asc"
          - "healthy", "nutritious" → sort: "healthiness", sortDirection: "desc"
          - "popular", "best" → sort: "popularity", sortDirection: "desc"
        `,
        inputSchema: z.object({
          query: z.string().describe("The main food query (e.g. 'pasta', 'stew')"),
          includeIngredients: z.string().optional(),
          cuisine: z.string().optional(),
          diet: z.string().optional(),
          maxReadyTime: z.number().optional(),
          type: z.string().optional(),
          sort: z
            .enum(["popularity", "healthiness", "time", "random", "price"])
            .optional()
            .describe("Sort results by this criteria based on user intent"),
          sortDirection: z
            .enum(["asc", "desc"])
            .optional()
            .describe("Sort direction (asc or desc)"),
        }),
        execute: async ({ query, includeIngredients, cuisine, diet, maxReadyTime, type, sort, sortDirection }: {
          query: string;
          includeIngredients?: string;
          cuisine?: string;
          diet?: string;
          maxReadyTime?: number;
          type?: string;
          sort?: "popularity" | "healthiness" | "time" | "random" | "price";
          sortDirection?: "asc" | "desc";
        }) => {
          const apiKey = process.env.SPOONACULAR_API_KEY;
          if (!apiKey) {
            throw new Error("Configuration Error: Missing Spoonacular API Key");
          }

          // Fetch more results to account for filtering out seen recipes
          const fetchCount = seenRecipeIds.length > 0 ? "10" : "3";
          const params = new URLSearchParams({
            apiKey,
            query,
            number: fetchCount,
            addRecipeInformation: "true",
            fillIngredients: "false",
            instructionsRequired: "true",
          });

          if (includeIngredients) params.append("includeIngredients", includeIngredients);
          if (cuisine) params.append("cuisine", cuisine);
          if (diet) params.append("diet", diet);
          if (maxReadyTime) params.append("maxReadyTime", maxReadyTime.toString());
          if (type) params.append("type", type);
          if (sort) params.append("sort", sort);
          if (sortDirection) params.append("sortDirection", sortDirection);

          try {
            const response = await fetch(
              `https://api.spoonacular.com/recipes/complexSearch?${params}`
            );

            if (!response.ok) {
              throw new Error(`Spoonacular API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Filter out already-seen recipes
            const seenSet = new Set(seenRecipeIds);
            const freshResults = data.results.filter((r: any) => !seenSet.has(r.id));

            if (freshResults.length === 0) {
              const allFiltered = data.results.length > 0;
              return {
                success: false,
                fallback: true,
                exhausted: allFiltered,
                message: allFiltered
                  ? `All ${query} recipes from the database have been shown. Suggest variations like "${query} stir-fry", "${query} soup", or a completely different dish. If the user really wants ${query}, write them a quick recipe from your own knowledge (ingredients + steps).`
                  : `No external recipes found for "${query}". DO NOT apologize or say "nothing found" — instead, write the user a recipe yourself from your own culinary knowledge. Include a short ingredient list and numbered steps. Frame it naturally like "Here's how I'd make ${query}:" and keep your persona's tone. The user should never feel like something broke.`,
              };
            }

            // Take the top result as THE recommendation
            const r = freshResults[0];
            const cleanSummary = r.summary
              ? r.summary.replace(/<[^>]*>?/gm, "")
              : "A classic preparation of this dish.";

            const recipe = {
              id: r.id,
              title: r.title,
              readyInMinutes: r.readyInMinutes,
              healthScore: r.healthScore,
              image: r.image,
              sourceUrl: r.sourceUrl,
              fullSummary: cleanSummary,
            };

            return { success: true, recipe };
          } catch {
            return {
              success: false,
              fallback: true,
              message: `Could not reach the recipe database for "${query}". DO NOT apologize or show an error — instead, write the user a recipe yourself from your own culinary knowledge. Include a short ingredient list and numbered steps. Frame it naturally like "Here's how I'd make ${query}:" and keep your persona's tone. The user should never feel like something broke.`,
            };
          }
        },
      });

      const result = streamText({
        model: anthropic("claude-haiku-4-5"),
        system: systemPrompt,
        messages: await convertToModelMessages(messages),
        tools: {
          searchRecipes: searchRecipesWithContext,
          findRestaurant: findRestaurantsTool,
          flagAbuse: createFlagAbuseTool(identifier),
          decisionRoulette: decisionRouletteTool,
        },
        stopWhen: stepCountIs(3), // Allow tool call + response in one turn
      });

      const response = result.toUIMessageStreamResponse();

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // Track streamed content size for token deduction
      let streamedBytes = 0;

      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          streamedBytes += value?.length || 0;
          res.write(value);
        }
      }

      res.end();

      // Deduct tokens after streaming completes (non-blocking)
      // Estimate: input tokens + output tokens (streamed bytes / 4)
      const outputTokens = Math.ceil(streamedBytes / 4);
      const totalTokens = estimatedInputTokens + outputTokens;
      deductTokens(identifier, totalTokens).catch(() => {});
    } catch {
      if (!res.headersSent) res.status(500).end();
    }
  });
};
