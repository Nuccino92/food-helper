import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePersona } from "@/context/PersonaProvider/hooks";
import { X, Plus, Shuffle } from "lucide-react";
import type { Persona } from "@/context/PersonaProvider/types";

// ─── Persona Theme Map ───

const PERSONA_THEMES: Record<
  Persona,
  {
    text: string;
    bg: string;
    border: string;
    accent: string;
    glow1: string;
    glow2: string;
    buttonBg: string;
    tagBg: string;
    tagBorder: string;
    confetti: string[];
  }
> = {
  "assistant-miso": {
    text: "text-teal-700 dark:text-teal-300",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800",
    accent: "text-teal-600 dark:text-teal-400",
    glow1: "rgba(64, 224, 208, 0.4)",
    glow2: "rgba(32, 178, 170, 0.6)",
    buttonBg: "bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-500",
    tagBg: "bg-teal-100 dark:bg-teal-900/50",
    tagBorder: "border-teal-300 dark:border-teal-700",
    confetti: ["#2dd4bf", "#14b8a6", "#5eead4", "#99f6e4", "#0d9488"],
  },
  "assistant-gordon": {
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
    accent: "text-rose-600 dark:text-rose-400",
    glow1: "rgba(220, 20, 60, 0.4)",
    glow2: "rgba(255, 99, 71, 0.6)",
    buttonBg: "bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500",
    tagBg: "bg-rose-100 dark:bg-rose-900/50",
    tagBorder: "border-rose-300 dark:border-rose-700",
    confetti: ["#fb7185", "#f43f5e", "#fda4af", "#fecdd3", "#e11d48"],
  },
  "assistant-sancho": {
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    accent: "text-amber-600 dark:text-amber-400",
    glow1: "rgba(184, 134, 11, 0.4)",
    glow2: "rgba(218, 165, 32, 0.6)",
    buttonBg: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500",
    tagBg: "bg-amber-100 dark:bg-amber-900/50",
    tagBorder: "border-amber-300 dark:border-amber-700",
    confetti: ["#fbbf24", "#f59e0b", "#fcd34d", "#fde68a", "#d97706"],
  },
};

// ─── Confetti Burst ───

const CONFETTI_COUNT = 35;

interface ConfettiParticle {
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: "square" | "circle" | "strip";
}

function generateParticles(colors: string[]): ConfettiParticle[] {
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    x: Math.random() * 200 - 100, // spread: -100 to 100
    y: -(Math.random() * 120 + 40), // upward: -40 to -160
    rotation: Math.random() * 720 - 360,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 6 + 4, // 4-10px
    delay: Math.random() * 0.3,
    duration: Math.random() * 0.8 + 1.2, // 1.2-2s
    shape: (["square", "circle", "strip"] as const)[
      Math.floor(Math.random() * 3)
    ],
  }));
}

function ConfettiBurst({ colors }: { colors: string[] }) {
  const particles = useMemo(() => generateParticles(colors), [colors]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {particles.map((p, i) => (
        <span
          key={i}
          className="roulette-confetti absolute left-1/2 top-1/2"
          style={{
            "--confetti-x": `${p.x}px`,
            "--confetti-y": `${p.y}px`,
            "--confetti-r": `${p.rotation}deg`,
            backgroundColor: p.color,
            width:
              p.shape === "strip" ? `${p.size * 0.4}px` : `${p.size}px`,
            height:
              p.shape === "strip" ? `${p.size * 1.8}px` : `${p.size}px`,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Animation Helpers ───

const TOTAL_DURATION = 4000;
const FAST_PHASE_RATIO = 0.5;

function getIntervalForProgress(progress: number): number {
  if (progress < FAST_PHASE_RATIO) {
    return 60; // ~16 swaps/sec during fast phase
  }
  // Deceleration phase: interval grows cubically
  const decelProgress =
    (progress - FAST_PHASE_RATIO) / (1 - FAST_PHASE_RATIO);
  const eased = decelProgress * decelProgress * decelProgress;
  return 60 + eased * 740; // 60ms → 800ms
}

function buildSwapSequence(
  optionCount: number,
  winnerIndex: number
): { time: number; index: number }[] {
  const swaps: { time: number; index: number }[] = [];
  let time = 0;
  let index = 0;

  while (time < TOTAL_DURATION) {
    const progress = time / TOTAL_DURATION;
    const interval = getIntervalForProgress(progress);
    time += interval;
    index = (index + 1) % optionCount;
    swaps.push({ time, index });
  }

  // Guarantee landing on the winner
  if (swaps.length > 0) {
    swaps[swaps.length - 1].index = winnerIndex;
    // Ensure second-to-last isn't also the winner (so there's a visible final swap)
    if (
      swaps.length > 1 &&
      swaps[swaps.length - 2].index === winnerIndex
    ) {
      swaps[swaps.length - 2].index =
        (winnerIndex + 1) % optionCount;
    }
  }

  return swaps;
}

// ─── Component ───

type RouletteState = "card" | "editing" | "spinning" | "landed";

interface DecisionRouletteProps {
  options: string[];
  onSendMessage: (message: string) => void;
}

export function DecisionRoulette({
  options: initialOptions,
  onSendMessage,
}: DecisionRouletteProps) {
  const { persona } = usePersona();
  const theme = PERSONA_THEMES[persona];

  const [state, setState] = useState<RouletteState>("card");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableOptions, setEditableOptions] =
    useState<string[]>(initialOptions);
  const [newOption, setNewOption] = useState("");
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0);
  const [finalPick, setFinalPick] = useState<string | null>(null);

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const startSpin = useCallback(() => {
    setState("spinning");

    const opts = editableOptions;
    const winnerIndex = Math.floor(Math.random() * opts.length);
    setFinalPick(opts[winnerIndex]);

    const swaps = buildSwapSequence(opts.length, winnerIndex);
    startTimeRef.current = performance.now();
    let swapPointer = 0;

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;

      // Process all swaps that should have happened by now
      while (
        swapPointer < swaps.length &&
        elapsed >= swaps[swapPointer].time
      ) {
        setCurrentDisplayIndex(swaps[swapPointer].index);
        swapPointer++;
      }

      if (swapPointer >= swaps.length) {
        setState("landed");
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [editableOptions]);

  const handleRemoveOption = (index: number) => {
    setEditableOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddOption = () => {
    const trimmed = newOption.trim();
    if (trimmed && editableOptions.length < 6) {
      setEditableOptions((prev) => [...prev, trimmed]);
      setNewOption("");
    }
  };

  const handleConfirmPick = () => {
    if (finalPick) {
      onSendMessage(
        `[Roulette Result] The randomizer picked: ${finalPick}!`
      );
      setIsModalOpen(false);
    }
  };

  const handleSpinAgain = () => {
    setFinalPick(null);
    startSpin();
  };

  // ─── Inline Card (shown in chat) ───

  if (state === "card") {
    return (
      <div
        className={cn(
          "mb-3 max-w-sm rounded-xl border p-4 shadow-sm",
          theme.bg,
          theme.border
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <Shuffle className={cn("h-5 w-5", theme.accent)} />
          <h3 className={cn("text-sm font-semibold", theme.text)}>
            Decision Roulette
          </h3>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {initialOptions.map((opt, i) => (
            <span
              key={i}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                theme.tagBg,
                theme.tagBorder,
                theme.text
              )}
            >
              {opt}
            </span>
          ))}
        </div>

        <Button
          onClick={() => {
            setIsModalOpen(true);
            setState("editing");
          }}
          className={cn("w-full font-medium text-white", theme.buttonBg)}
        >
          Let's Go
        </Button>
      </div>
    );
  }

  // ─── Modal ───

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open && state !== "spinning") {
          setIsModalOpen(false);
          setState("card");
          setFinalPick(null);
        }
      }}
    >
      <DialogContent
        className="overflow-hidden sm:max-w-md"
        showCloseButton={state !== "spinning"}
      >
        <DialogHeader>
          <DialogTitle
            className={cn("flex items-center gap-2", theme.text)}
          >
            <Shuffle className="h-5 w-5" />
            Decision Roulette
          </DialogTitle>
          <DialogDescription>
            {state === "editing" && "Add or remove options, then spin!"}
            {state === "spinning" && "Here we go..."}
            {state === "landed" && "The universe has spoken."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Editing State ── */}
        {state === "editing" && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {editableOptions.map((opt, i) => (
                <span
                  key={i}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium",
                    theme.tagBg,
                    theme.tagBorder,
                    theme.text
                  )}
                >
                  {opt}
                  {editableOptions.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(i)}
                      className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>

            {editableOptions.length < 6 && (
              <div className="flex gap-2">
                <input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder="Add an option..."
                  maxLength={30}
                  className="border-input bg-background flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-offset-1"
                />
                <Button
                  onClick={handleAddOption}
                  disabled={!newOption.trim()}
                  size="icon"
                  className={cn("shrink-0 text-white", theme.buttonBg)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button
              onClick={startSpin}
              className={cn(
                "w-full py-6 text-lg font-bold text-white",
                theme.buttonBg
              )}
            >
              Spin!
            </Button>
          </div>
        )}

        {/* ── Spinning / Landed State ── */}
        {(state === "spinning" || state === "landed") && (
          <div className="flex flex-col items-center gap-6 py-4">
            {/* Display box */}
            <div
              className={cn(
                "relative flex h-24 w-full items-center justify-center rounded-2xl border-2",
                state === "landed"
                  ? cn(theme.border, theme.bg)
                  : "border-transparent",
                state === "spinning" && "roulette-spinning"
              )}
              style={{
                "--roulette-glow-1": theme.glow1,
                "--roulette-glow-2": theme.glow2,
                ...(state === "landed"
                  ? {
                      boxShadow: `0 0 30px ${theme.glow1}, 0 0 60px ${theme.glow2}`,
                    }
                  : {}),
              } as React.CSSProperties}
            >
              <span
                className={cn(
                  "select-none text-3xl font-bold",
                  state === "landed"
                    ? cn(theme.accent, "roulette-landed-text")
                    : "text-foreground"
                )}
              >
                {editableOptions[currentDisplayIndex]}
              </span>
              {state === "landed" && (
                <ConfettiBurst colors={theme.confetti} />
              )}
            </div>

            {state === "spinning" && (
              <p className="animate-pulse text-sm text-slate-500 dark:text-slate-400">
                Choosing...
              </p>
            )}

            {state === "landed" && finalPick && (
              <div className="flex w-full flex-col items-center gap-3">
                <Button
                  onClick={handleConfirmPick}
                  className={cn(
                    "w-full py-5 font-medium text-white",
                    theme.buttonBg
                  )}
                >
                  Let's eat!
                </Button>
                <button
                  onClick={handleSpinAgain}
                  className="text-sm text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  Spin again
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
