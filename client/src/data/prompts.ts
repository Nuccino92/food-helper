import { Gift, Zap, Leaf, ChefHat, type LucideIcon } from "lucide-react";

// Update the type to include the icon
export type QuickSelectPrompt = {
  title: string;
  prompt: string;
  icon: LucideIcon; // Using LucideIcon for strong typing
};

// TODO: possibly add further instruction

// Export the array of prompts as a constant
export const QUICK_SELECT_PROMPTS: QuickSelectPrompt[] = [
  {
    title: "Surprise Me!",
    prompt: "Surprise me with a dinner idea.",
    icon: Gift,
  },
  {
    title: "Something Quick",
    prompt: "I need a quick meal, Miso.",
    icon: Zap,
  },
  {
    title: "Healthy Choice",
    prompt: "I'm looking for a healthy option tonight.",
    icon: Leaf,
  },
  {
    title: "Use My Ingredients",
    prompt: "I want to cook with ingredients I already have.",
    icon: ChefHat,
  },
];
