import { useState } from "react";
import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Persona } from "@/context/PersonaProvider/types";

export interface PersonaInterface {
  name: string;
  value: Persona;
  emoji: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
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

      {/* Force light mode styling */}
      <DialogContent
        className="flex h-dvh w-full max-w-full flex-col rounded-none bg-white p-0 sm:h-auto sm:max-w-sm sm:rounded-2xl"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="space-y-1 px-6 pt-6 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Who's serving you today?
          </h2>
          <p className="text-sm text-slate-500">
            Pick a personality to match your mood
          </p>
        </div>

        {/* Persona Cards */}
        <div className="flex flex-col gap-3 px-6 pb-6">
          {PERSONAS.map((persona) => {
            const isSelected = selectedPersona.value === persona.value;

            return (
              <button
                key={persona.value}
                onClick={() => handlePersonaSelect(persona.value)}
                className={cn(
                  "group relative flex items-center gap-4 overflow-hidden rounded-xl border-2 p-4 text-left",
                  "transition-all duration-200 ease-out",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isSelected
                    ? `${persona.borderColor} ${persona.bgColor}`
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                {/* Emoji Container - rounded box aligned left */}
                <div
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-xl",
                    "transition-all duration-200 ease-out",
                    isSelected ? persona.bgColor : "bg-slate-100"
                  )}
                >
                  <span className="text-3xl transition-transform duration-200 ease-out group-hover:scale-110">
                    {persona.emoji}
                  </span>
                </div>

                {/* Text Content - Right side */}
                <div className="flex flex-1 flex-col justify-center gap-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-base font-semibold",
                        isSelected ? persona.color : "text-slate-900"
                      )}
                    >
                      {persona.name}
                    </span>
                    {isSelected && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          persona.bgColor,
                          persona.color
                        )}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm leading-snug text-slate-500">
                    {persona.tagline}
                  </p>
                </div>

                {/* Selected indicator - right edge */}
                {isSelected && (
                  <div
                    className={cn(
                      "absolute right-0 top-0 h-full w-1",
                      persona.color.replace("text-", "bg-")
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="border-t border-slate-100 px-6 py-4">
          <p className="text-center text-xs text-slate-400">
            Switching assistants will reset the current conversation
          </p>
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
    tagline: "Your enthusiastic foodie friend who keeps it simple and fun",
    description:
      "Your enthusiastic, emoji-loving server who acts more like a supportive best friend. Miso keeps the options simple and snappy to help you make a decision quickly without getting overwhelmed.",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-300",
  },
  {
    name: "Gordon",
    value: "assistant-gordon",
    emoji: "🤨",
    tagline: "The perfectionist who demands culinary excellence",
    description:
      "A high-end, perfectionist maître d' who tolerates nothing less than culinary sophistication. He will guide you toward the 'correct' meal choice but isn't afraid to critique your primitive palate if you choose poorly.",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-300",
  },
  {
    name: "Sancho",
    value: "assistant-sancho",
    emoji: "😒",
    tagline: "The sarcastic server with zero patience for indecision",
    description:
      "A disgruntled server who hates this establishment and has zero patience for your indecision. He'll begrudgingly help you pick a dish, but expect plenty of sass, complaints, and eye-rolls along the way.",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
  },
] as const;
