import { tool } from "ai";
import { z } from "zod";

/**
 * FIND RESTAURANTS TOOL
 * ---------------------
 * This tool connects to the Yelp Fusion API to find places to "Eat Out."
 *
 * USAGE:
 * The AI should use this when the user's intent is "Dining Out," "Delivery,"
 * or "Takeout." It complements the Recipe tool (Cooking) to give Miso full coverage.
 *
 * PREREQUISITES:
 * - You need a Yelp Fusion API Key in your .env file (YELP_API_KEY).
 * - The AI *must* know the location (City/Neighborhood) before calling this.
 */
export const findRestaurantsTool = tool({
  // 1. Description
  // Crucial: We explicitly tell the AI NOT to use this for recipes.
  // We also force the AI to ask for 'location' if it's missing from the chat context.
  description: `
    Call this tool ONLY when the user explicitly wants to 'eat out', 'order in', 'go to a restaurant', or 'find food near me'.
    Do NOT use this for recipes or cooking instructions.
    
    CRITICAL: You MUST ask the user for their location (City, Neighborhood, or Zip) before calling this tool.
    Returns a list of local restaurants with ratings, prices, and addresses.
  `,

  // 2. Input Schema
  inputSchema: z.object({
    location: z
      .string()
      .describe(
        "The user's city, neighborhood, or address (e.g. 'Toronto', 'Downtown', '123 Main St')"
      ),

    term: z
      .string()
      .optional()
      .describe(
        "The type of food or venue name (e.g. 'Sushi', 'Pizza', 'McDonalds', 'Romantic Dinner')"
      ),

    price: z
      .string()
      .optional()
      .describe(
        "Yelp Price filter: '1' ($), '2' ($$), '3' ($$$), '4' ($$$$). Use numbers as strings."
      ),

    open_now: z
      .boolean()
      .optional()
      .describe(
        "If true, filters results to only show places open right now. Useful for late-night requests."
      ),
  }),

  // 3. Execution Logic
  execute: async ({ location, term, price, open_now }) => {
    // -- Step A: Security Check --
    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) {
      throw new Error("Configuration Error: Missing Yelp API Key");
    }

    // -- Step B: Construct Query --
    const params = new URLSearchParams({
      location: location,
      term: term || "restaurants", // Default to general restaurants if no cuisine specified
      sort_by: "best_match", // Yelp's default ranking algorithm
      limit: "5", // LIMIT: Keep it tight (5 results) to save screen space
    });

    if (price) params.append("price", price);
    if (open_now) params.append("open_now", "true");

    try {
      // -- Step C: API Call --
      // NOTE: Yelp uses 'Authorization: Bearer <Key>', different from Spoonacular's query param.
      const response = await fetch(
        `https://api.yelp.com/v3/businesses/search?${params}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Yelp API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // -- Step D: Data Cleanup --
      // Map the raw Yelp data to a clean, simple object for Miso.
      const restaurants = data.businesses.map((b: any) => ({
        name: b.name,
        rating: b.rating, // e.g. 4.5
        review_count: b.review_count,
        price: b.price, // e.g. "$$"
        address: b.location.address1,
        city: b.location.city,
        is_closed: b.is_closed, // Boolean: is it closed right now?
        url: b.url, // Link to Yelp page (Vital for user trust)
        image_url: b.image_url, // Thumbnail image
      }));

      // -- Step E: Empty State --
      if (restaurants.length === 0) {
        return {
          success: false,
          message: `No restaurants found in ${location} matching '${term}'. Ask the user to try a different location or cuisine.`,
        };
      }

      return {
        success: true,
        restaurants: restaurants,
      };
    } catch (error) {
      console.error("Yelp Error:", error);
      return {
        success: false,
        message: "Failed to find restaurants due to an API error.",
      };
    }
  },
});
