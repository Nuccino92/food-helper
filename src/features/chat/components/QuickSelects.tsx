import { Button } from "@/components/ui/button";
import type { QuickSelectPrompt } from "@/data/prompts";

interface QuickSelectsProps {
  prompts: QuickSelectPrompt[];
  onSelect: (prompt: string) => void;
}

export default function QuickSelects({ prompts, onSelect }: QuickSelectsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
      {prompts.map((prompt) => (
        <Button
          key={prompt.title}
          variant="outline"
          className="h-full p-4 text-center! text-lg whitespace-normal"
          onClick={() => onSelect(prompt.prompt)}
        >
          {prompt.title}
        </Button>
      ))}
    </div>
  );
}
