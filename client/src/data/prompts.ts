import { HelpCircle, Users, Zap, ChefHat, type LucideIcon } from "lucide-react";

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
    title: "I Can't Decide",
    prompt: "I have no idea what I want to eat.",
    icon: HelpCircle,
  },
  {
    title: "Family Can't Agree",
    prompt: "We're a group and no one can agree on food.",
    icon: Users,
  },
  {
    title: "Something Quick",
    prompt: "I need something quick to eat.",
    icon: Zap,
  },
  {
    title: "Use My Ingredients",
    prompt: "I want to cook with ingredients I already have.",
    icon: ChefHat,
  },
];
