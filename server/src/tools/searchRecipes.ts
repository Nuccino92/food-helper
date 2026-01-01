import { tool } from "ai";
import { z } from "zod";

/**
 * SEARCH RECIPES TOOL
 * -------------------
 * This tool connects the AI to the Spoonacular API to fetch real recipe data.
 *
 * USAGE:
 * The AI calls this when the user's intent is clearly about finding specific meals.
 * It is designed to be "Search-First," meaning it expects specific constraints
 * (like ingredients or cuisine) rather than vague requests.
 */
export const searchRecipesTool = tool({
  // 1. Description
  // The AI reads this string to decide IF and WHEN to call this tool.
  // We explicitly tell it to wait for constraints to prevent "hallucinated" searches.
  description: `
    Call this tool ONLY when the user has agreed to a specific food or asking for a recipe.
    Returns recipe metadata (Title, Time, Health Score) and UI links.
    Do NOT read the raw links or image URLs in your response. 
    Use the 'readyInMinutes' and 'healthScore' to color your commentary (e.g. "It's super fast" or "It's a bit indulgent").
  `,

  // 2. Input Schema (Zod)
  // This defines the strict JSON structure the AI must generate to call this function.
  inputSchema: z.object({
    query: z.string().describe("The main food query (e.g. 'pasta', 'stew')"),
    includeIngredients: z.string().optional(),
    cuisine: z.string().optional(),
    diet: z.string().optional(),
    maxReadyTime: z.number().optional(),
    type: z.string().optional(),
  }),

  // 3. Execution Logic
  // This runs on your Node.js server when the AI triggers the tool.
  execute: async ({
    query,
    includeIngredients,
    cuisine,
    diet,
    maxReadyTime,
    type,
  }) => {
    // -- Step A: Security Check --
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error("Configuration Error: Missing Spoonacular API Key");
    }

    // -- Step B: Construct Query --
    // We use URLSearchParams to handle escaping special characters automatically.
    const params = new URLSearchParams({
      apiKey,
      query,
      number: "3", // LIMIT: Keep low to save LLM context tokens (and screen space).
      addRecipeInformation: "true", // REQUIRED: This gives us the 'sourceUrl' and 'image'.
      fillIngredients: "false", // OPTIMIZATION: We don't need detailed grocery lists here, saves bandwidth.
      instructionsRequired: "true", // QUALITY CONTROL: Only show recipes that actually have steps.
    });

    // Append optional filters only if the AI provided them
    if (includeIngredients)
      params.append("includeIngredients", includeIngredients);
    if (cuisine) params.append("cuisine", cuisine);
    if (diet) params.append("diet", diet);
    if (maxReadyTime) params.append("maxReadyTime", maxReadyTime.toString());
    if (type) params.append("type", type);

    try {
      // -- Step C: API Call --
      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?${params}`
      );

      if (!response.ok) {
        throw new Error(
          `Spoonacular API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // -- Step D: Token Economy (Data Transformation) --
      // The API returns HUGE objects. We map them down to exactly what the AI/UI needs.
      // If we passed the raw JSON to the AI, it would eat up thousands of tokens ($$$).
      const results = data.results.map((r: any) => ({
        id: r.id,
        title: r.title,
        readyInMinutes: r.readyInMinutes,
        healthScore: r.healthScore, // 0-100 score.
        image: r.image, // High-res image for the UI card
        sourceUrl: r.sourceUrl, // The link to the blog/site (CRITICAL for user trust)

        // Clean up the summary: Remove HTML tags (<b>, <a>) and truncate to 150 chars.
        summary: r.summary
          ? r.summary.replace(/<[^>]*>?/gm, "").split(".")[0] + "."
          : "A classic preparation of this dish.",
      }));

      // -- Step E: Handle Empty States --
      if (results.length === 0) {
        return {
          success: false,
          message:
            "No recipes found. Tell the user to be less specific or remove filters.",
        };
      }

      // Success! Return the clean list.
      return {
        success: true,
        recipes: results,
      };
    } catch (error) {
      console.error("Spoonacular Error:", error);
      // Graceful failure: Let the AI know it failed so it can apologize to the user.
      return {
        success: false,
        message: "API Error. Apologize to the user.",
      };
    }
  },
});
