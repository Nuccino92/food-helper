import { Button } from "@/components/ui/button";
import type { QuickSelectPrompt } from "@/data/prompts";

interface QuickSelectsProps {
  prompts: QuickSelectPrompt[];
  onSelect: (prompt: string) => void;
}

export default function QuickSelects({ prompts, onSelect }: QuickSelectsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
      {prompts.map((prompt) => {
        const Icon = prompt.icon;

        return (
          <Button
            key={prompt.title}
            variant="outline"
            className="dark:border-input flex h-full border-gray-200 p-4 whitespace-normal shadow sm:justify-start!"
            onClick={() => onSelect(prompt.prompt)}
          >
            <div className="hidden sm:block">
              <Icon className="mr-2 h-5 w-5" />
            </div>

            {prompt.title}
          </Button>
        );
      })}
    </div>
  );
}
