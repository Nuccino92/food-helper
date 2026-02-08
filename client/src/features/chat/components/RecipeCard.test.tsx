import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecipeCard } from "./RecipeCard";

const mockRecipe = {
  id: 123,
  title: "Spicy Chicken Tacos",
  image: "https://example.com/tacos.jpg",
  sourceUrl: "https://example.com/recipe/tacos",
  readyInMinutes: 25,
};

describe("RecipeCard", () => {
  it("should render recipe title", () => {
    render(<RecipeCard recipe={mockRecipe} />);

    expect(screen.getByText("Spicy Chicken Tacos")).toBeInTheDocument();
  });

  it("should render cook time", () => {
    render(<RecipeCard recipe={mockRecipe} />);

    expect(screen.getByText(/25 min/)).toBeInTheDocument();
  });

  it("should link to the source URL in a new tab", () => {
    render(<RecipeCard recipe={mockRecipe} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/recipe/tacos");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should render the recipe image with alt text", () => {
    render(<RecipeCard recipe={mockRecipe} />);

    const img = screen.getByAltText("Spicy Chicken Tacos");
    expect(img).toHaveAttribute("src", "https://example.com/tacos.jpg");
  });

  it("should return null when recipe is falsy", () => {
    // @ts-expect-error testing defensive null guard
    const { container } = render(<RecipeCard recipe={null} />);

    expect(container.innerHTML).toBe("");
  });
});
