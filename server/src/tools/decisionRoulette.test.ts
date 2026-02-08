import { describe, it, expect } from "vitest";
import { decisionRouletteTool } from "./decisionRoulette.js";

describe("decisionRouletteTool", () => {
  it("should return success with the provided options", async () => {
    const result = await decisionRouletteTool.execute!(
      { options: ["Tacos", "Pizza", "Sushi"] },
      { toolCallId: "test", messages: [], abortSignal: undefined as any }
    );

    expect(result).toEqual({
      success: true,
      options: ["Tacos", "Pizza", "Sushi"],
    });
  });

  it("should pass through options unchanged", async () => {
    const options = ["Burgers", "Ramen"];
    const result = (await decisionRouletteTool.execute!(
      { options },
      { toolCallId: "test", messages: [], abortSignal: undefined as any }
    )) as { success: boolean; options: string[] };

    expect(result.options).toEqual(options);
    expect(result.options).toHaveLength(2);
  });
});
