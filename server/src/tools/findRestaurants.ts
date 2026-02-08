import { tool } from "ai";
import { z } from "zod";

/**
 * FIND RESTAURANTS TOOL (Menu Item Discovery)
 * -------------------------------------------
 * This tool connects to Spoonacular's Menu Items API to find chain restaurant options.
 *
 * IMPORTANT LIMITATION:
 * This tool ONLY searches major US chain restaurants (McDonald's, Chipotle, Olive Garden, etc.)
 * It cannot find local/independent restaurants. The AI should frame results as INSPIRATION,
 * not concrete "go here" suggestions. Users will need to search locally for actual locations.
 *
 * STRENGTH:
 * Dietary filtering (keto, vegan, gluten-free, macros) - this is where Spoonacular shines.
 *
 * USAGE:
 * The AI should use this when users want dining-out options, especially with dietary constraints.
 * Results should be framed as: "You might enjoy something like [dish] from [chain] -
 * search for similar options near you."
 */
export const findRestaurantsTool = tool({
  description: `
    Search for restaurant menu items from major US chain restaurants.

    CRITICAL LIMITATIONS (tell the user):
    - Only searches CHAIN restaurants (McDonald's, Chipotle, Applebee's, etc.)
    - Cannot find local/independent restaurants
    - Use results as INSPIRATION - suggest the TYPE of food, then encourage user to find nearby options

    BEST FOR:
    - Dietary needs: "keto options", "vegan meals", "gluten-free", "high protein"
    - Calorie/macro targets: "under 500 calories", "low carb"
    - Cuisine inspiration: "Mexican food", "healthy salads"

    After returning results, suggest: "Search '[cuisine type] restaurants near me' to find local options"

    You should still ask for the user's location for regional availability context.
  `,

  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The food type, cuisine, or dish to search for (e.g., 'keto burger', 'vegan bowl', 'grilled chicken salad')"
      ),

    location: z
      .string()
      .optional()
      .describe(
        "User's city or region - used for context in AI response, not for filtering (chains are nationwide)"
      ),

    // Dietary/macro filters - the tool's strength
    maxCalories: z
      .number()
      .optional()
      .describe("Maximum calories per serving (e.g., 500 for low-cal options)"),

    maxCarbs: z
      .number()
      .optional()
      .describe(
        "Maximum carbohydrates in grams (e.g., 20 for keto/low-carb)"
      ),

    minProtein: z
      .number()
      .optional()
      .describe(
        "Minimum protein in grams (e.g., 30 for high-protein meals)"
      ),

    maxFat: z
      .number()
      .optional()
      .describe("Maximum fat in grams"),
  }),

  execute: async ({ query, location, maxCalories, maxCarbs, minProtein, maxFat }) => {
    const apiKey = process.env.SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error("Configuration Error: Missing Spoonacular API Key");
    }

    // Build query params
    const params = new URLSearchParams({
      query: query,
      number: "5", // Keep results tight
      addMenuItemInformation: "true", // Get nutrition data
      apiKey: apiKey,
    });

    if (maxCalories) params.append("maxCalories", maxCalories.toString());
    if (maxCarbs) params.append("maxCarbs", maxCarbs.toString());
    if (minProtein) params.append("minProtein", minProtein.toString());
    if (maxFat) params.append("maxFat", maxFat.toString());

    try {
      const url = `https://api.spoonacular.com/food/menuItems/search?${params}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Spoonacular API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Map to clean format with nutrition summary
      const menuItems = (data.menuItems || []).map((item: any) => ({
        name: item.title,
        restaurant: item.restaurantChain,
        image: item.image,
        // Nutrition summary (if available via addMenuItemInformation)
        nutrition: item.nutrition
          ? {
              calories: item.nutrition.calories,
              protein: item.nutrition.protein,
              carbs: item.nutrition.carbs,
              fat: item.nutrition.fat,
            }
          : null,
      }));

      if (menuItems.length === 0) {
        return {
          success: false,
          message: `No chain restaurant menu items found for '${query}'.`,
          searchTip: `Try searching "${query} restaurants near ${location || "me"}" on Google Maps to find local options.`,
          limitation:
            "Remember: This tool only searches major chain restaurants, not local spots.",
        };
      }

      return {
        success: true,
        menuItems: menuItems,
        totalFound: data.totalMenuItems,
        context: {
          location: location || "not specified",
          searchedFor: query,
        },
        // Remind AI how to frame these results
        framingNote:
          "Present these as INSPIRATION. Suggest the user search for similar options near them.",
        searchTip: `Suggest user search: "${query} restaurants near ${location || "me"}" to find local options.`,
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to search menu items due to an API error.",
        searchTip: `Try searching "${query} restaurants" on Google Maps or Yelp.`,
      };
    }
  },
});
