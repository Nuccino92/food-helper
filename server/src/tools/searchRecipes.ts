import { tool } from "ai";
import { z } from "zod";

/**
 * SEARCH RECIPES TOOL (LEGACY - NOT USED)
 * ---------------------------------------
 * This standalone tool is kept for reference.
 * The actual tool with seenRecipeIds context is defined inline in chat.ts
 */
export const searchRecipesTool = tool({
  description: `
    Call this tool ONLY when the user has agreed to a specific food or asking for a recipe.
    Returns recipe metadata (Title, Time, Health Score) and UI links.
    Do NOT read the raw links or image URLs in your response.
    Use the 'readyInMinutes' and 'healthScore' to color your commentary.
  `,

  inputSchema: z.object({
    query: z.string().describe("The main food query (e.g. 'pasta', 'stew')"),
    includeIngredients: z.string().optional(),
    cuisine: z.string().optional(),
    diet: z.string().optional(),
    maxReadyTime: z.number().optional(),
    type: z.string().optional(),
  }),

  execute: async ({
    query,
    includeIngredients,
    cuisine,
    diet,
    maxReadyTime,
    type,
  }) => {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error("Configuration Error: Missing Spoonacular API Key");
    }

    const params = new URLSearchParams({
      apiKey,
      query,
      number: "3",
      addRecipeInformation: "true",
      fillIngredients: "false",
      instructionsRequired: "true",
    });

    if (includeIngredients) params.append("includeIngredients", includeIngredients);
    if (cuisine) params.append("cuisine", cuisine);
    if (diet) params.append("diet", diet);
    if (maxReadyTime) params.append("maxReadyTime", maxReadyTime.toString());
    if (type) params.append("type", type);

    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?${params}`
      );

      if (!response.ok) {
        throw new Error(`Spoonacular API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const results = data.results.map((r: any) => ({
        id: r.id,
        title: r.title,
        readyInMinutes: r.readyInMinutes,
        healthScore: r.healthScore,
        image: r.image,
        sourceUrl: r.sourceUrl,
        summary: r.summary
          ? r.summary.replace(/<[^>]*>?/gm, "").split(".")[0] + "."
          : "A classic preparation of this dish.",
      }));

      if (results.length === 0) {
        return {
          success: false,
          message: "No recipes found. Tell the user to be less specific or remove filters.",
        };
      }

      return { success: true, recipes: results };
    } catch (error) {
      console.error("Spoonacular Error:", error);
      return { success: false, message: "API Error. Apologize to the user." };
    }
  },
});
