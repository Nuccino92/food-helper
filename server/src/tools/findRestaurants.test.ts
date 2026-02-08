import { describe, it, expect, vi, beforeEach } from "vitest";
import { findRestaurantsTool } from "./findRestaurants.js";

const mockExecuteContext = {
  toolCallId: "test",
  messages: [],
  abortSignal: undefined as any,
};

describe("findRestaurantsTool", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.SPOONACULAR_API_KEY = "test-key";
  });

  it("should return mapped menu items on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          menuItems: [
            {
              title: "Grilled Chicken Bowl",
              restaurantChain: "Chipotle",
              image: "https://example.com/bowl.jpg",
              nutrition: {
                calories: 450,
                protein: "35g",
                carbs: "40g",
                fat: "15g",
              },
            },
          ],
          totalMenuItems: 1,
        }),
      })
    );

    const result = (await findRestaurantsTool.execute!(
      { query: "chicken bowl" },
      mockExecuteContext
    )) as any;

    expect(result.success).toBe(true);
    expect(result.menuItems[0]).toEqual({
      name: "Grilled Chicken Bowl",
      restaurant: "Chipotle",
      image: "https://example.com/bowl.jpg",
      nutrition: {
        calories: 450,
        protein: "35g",
        carbs: "40g",
        fat: "15g",
      },
    });
  });

  it("should return failure with search tip when no items found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ menuItems: [], totalMenuItems: 0 }),
      })
    );

    const result = (await findRestaurantsTool.execute!(
      { query: "exotic dragon fruit tacos", location: "Austin" },
      mockExecuteContext
    )) as any;

    expect(result.success).toBe(false);
    expect(result.searchTip).toContain("Austin");
  });

  it("should handle API errors gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Internal Server Error" })
    );

    const result = (await findRestaurantsTool.execute!(
      { query: "pizza" },
      mockExecuteContext
    )) as any;

    expect(result.success).toBe(false);
    expect(result.searchTip).toBeDefined();
  });

  it("should throw when API key is missing", async () => {
    delete process.env.SPOONACULAR_API_KEY;

    await expect(
      findRestaurantsTool.execute!({ query: "tacos" }, mockExecuteContext)
    ).rejects.toThrow("Missing Spoonacular API Key");
  });
});
