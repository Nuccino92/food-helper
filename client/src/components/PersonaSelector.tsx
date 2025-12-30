import { useState } from "react";
import { Check, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Persona } from "@/context/PersonaProvider/types";

export interface PersonaInterface {
  name: string;
  value: Persona;
  emoji: string;
  description: string;
}

interface PersonaSelectorProps {
  selectedPersona: PersonaInterface;
  onPersonaChange: (persona: Persona) => void;
}

export function PersonaSelector({
  selectedPersona,
  onPersonaChange,
}: PersonaSelectorProps) {
  const [open, setOpen] = useState<boolean>(false);

  const handlePersonaSelect = (persona: Persona): void => {
    onPersonaChange(persona);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="dark:border-border gap-2 border-black/20"
        >
          <span className="text-lg">{selectedPersona.emoji}</span>
          <span>{selectedPersona.name}</span>
          <ChefHat className="h-4 w-4 opacity-50" />
        </Button>
      </DialogTrigger>

      <DialogContent className="flex h-dvh w-full max-w-full flex-col rounded-none p-6 sm:h-auto sm:max-w-md sm:rounded-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl">Choose Your Assistant</DialogTitle>
          <DialogDescription>
            Select the personality you would like.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 pr-2">
          <div className="flex flex-col gap-3">
            {PERSONAS.map((persona) => {
              const isSelected = selectedPersona.value === persona.value;

              return (
                <div
                  key={persona.value}
                  onClick={() => handlePersonaSelect(persona.value)}
                  className={cn(
                    "hover:bg-muted/50 cursor-pointer rounded-lg border p-4 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 hover:bg-primary/10"
                      : "border-border",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 text-3xl">{persona.emoji}</div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{persona.name}</span>
                          {isSelected && (
                            <Check className="text-primary h-4 w-4" />
                          )}
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {persona.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const PERSONAS = [
  {
    name: "Miso",
    value: "assistant-miso",
    emoji: "😄",
    description:
      "Your enthusiastic, emoji-loving server who acts more like a supportive best friend. Miso keeps the options simple and snappy to help you make a decision quickly without getting overwhelmed.",
  },
  {
    name: "Gordon",
    value: "assistant-gordon",
    emoji: "🤨",
    description:
      "A high-end, perfectionist maître d' who tolerates nothing less than culinary sophistication. He will guide you toward the 'correct' meal choice but isn't afraid to critique your primitive palate if you choose poorly.",
  },
  {
    name: "Sancho",
    value: "assistant-sancho",
    emoji: "😒",
    description:
      "A disgruntled server who hates this establishment and has zero patience for your indecision. He’ll begrudgingly help you pick a dish, but expect plenty of sass, complaints, and eye-rolls along the way.",
  },
] as const;
