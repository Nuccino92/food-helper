export type QuickSelectPrompt = {
  title: string;
  prompt: string;
};

// Export the array of prompts as a constant
export const QUICK_SELECT_PROMPTS: QuickSelectPrompt[] = [
  {
    title: "Surprise Me!",
    prompt: "Give me a fun and surprising fact about the ocean.",
  },
  {
    title: "Something Quick",
    prompt: "Write a two-sentence horror story.",
  },
  {
    title: "Healthy Choice",
    prompt:
      "What's a simple, healthy recipe I can make for lunch in under 10 minutes?",
  },
  {
    title: "Use My Ingredients",
    prompt: "I have chicken, rice, and broccoli. What can I make for dinner?",
  },
];
