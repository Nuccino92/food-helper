import { Router, Request, Response } from "express";
import { streamText, convertToModelMessages, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { buildSystemPrompt } from "../../personas";
import { findRestaurantsTool } from "../../tools/findRestaurants";

const router = Router();

export default (app: Router) => {
  app.use("/chat", router);

  router.post("/stream", async (req: Request, res: Response) => {
    try {
      const { messages, userLocalTime, personaId, seenRecipeIds = [] } = req.body;

      const systemPrompt = buildSystemPrompt(
        personaId || "assistant-miso",
        userLocalTime
      );

      // Create searchRecipes tool with seenRecipeIds context injected
      const searchRecipesWithContext = tool({
        description: `
          Call this tool ONLY when the user has agreed to a specific food or asking for a recipe.
          Returns recipe metadata (Title, Time, Health Score) and UI links.
          Do NOT read the raw links or image URLs in your response.
          Use the 'readyInMinutes' and 'healthScore' to color your commentary (e.g. "It's super fast" or "It's a bit indulgent").
          Use the 'fullSummary' field to understand the recipe better and make personalized recommendations.

          SORTING: Choose sort based on user context:
          - "quick dinner", "fast meal" → sort: "time", sortDirection: "asc"
          - "healthy", "nutritious" → sort: "healthiness", sortDirection: "desc"
          - "cheap", "budget" → sort: "price", sortDirection: "asc"
          - "popular", "best" → sort: "popularity", sortDirection: "desc"

          HEALTHY REQUESTS: When user asks for "healthy" food, interpret based on conversation context.
          Briefly mention your interpretation (e.g., "Here are some low-carb healthy options").
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

            // Transform and take first 3 fresh results
            const results = freshResults.slice(0, 3).map((r: any) => {
              const cleanSummary = r.summary
                ? r.summary.replace(/<[^>]*>?/gm, "")
                : "A classic preparation of this dish.";

              return {
                id: r.id,
                title: r.title,
                readyInMinutes: r.readyInMinutes,
                healthScore: r.healthScore,
                image: r.image,
                sourceUrl: r.sourceUrl,
                fullSummary: cleanSummary,
                summary: cleanSummary.length > 150
                  ? cleanSummary.substring(0, 150) + "..."
                  : cleanSummary,
              };
            });

            if (results.length === 0) {
              const allFiltered = data.results.length > 0 && freshResults.length === 0;
              return {
                success: false,
                exhausted: allFiltered,
                message: allFiltered
                  ? `All ${query} recipes have been shown. Suggest variations like "${query} stir-fry", "${query} soup", or a completely different dish.`
                  : "No recipes found. Tell the user to be less specific or remove filters.",
              };
            }

            return { success: true, recipes: results };
          } catch (error) {
            console.error("Spoonacular Error:", error);
            return { success: false, message: "API Error. Apologize to the user." };
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
