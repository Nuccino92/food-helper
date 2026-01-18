import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RateLimitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resetTime: number;
  canProvideFeedback: boolean;
  onFeedbackSubmit: (
    score: number,
  ) => Promise<{ success: boolean; message: string }>;
};

export function RateLimitModal({
  isOpen,
  onClose,
  resetTime,
  canProvideFeedback,
  onFeedbackSubmit,
}: RateLimitModalProps) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 1. Initialize states
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  // 2. Separate Effect: Lock in the Total Duration ONLY when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialSeconds = Math.max(
        0,
        Math.ceil((resetTime - Date.now()) / 1000),
      );
      setTotalDuration(initialSeconds);
      setTimeRemaining(initialSeconds);
    } else {
      // Reset when closed so it recalculates next time it opens
      setTotalDuration(0);
    }
  }, [isOpen, resetTime]); // Only run when isOpen changes (ignore resetTime changes during open)

  // 3. Separate Effect: Handle the countdown tick
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const seconds = Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
      setTimeRemaining(seconds);

      if (seconds <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, resetTime]);

  // Clean up selection on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedScore(null);
      setFeedbackResult(null);
    }
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFeedbackSubmit = async () => {
    if (selectedScore === null) return;
    setIsSubmitting(true);
    try {
      const result = await onFeedbackSubmit(selectedScore);
      setFeedbackResult(result);
      if (result.success) {
        setTimeout(() => onClose(), 1500);
      }
    } catch {
      setFeedbackResult({
        success: false,
        message: "Failed to submit. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Calculate Progress Logic
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Calculate percentage (0 to 1)
  // We use totalDuration || 1 to prevent division by zero
  const percentage = totalDuration > 0 ? timeRemaining / totalDuration : 0;

  // Calculate offset:
  // Full bar (100%) -> offset 0
  // Empty bar (0%) -> offset = circumference
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="overflow-hidden bg-white text-slate-900 sm:max-w-md"
        showCloseButton={true}
      >
        <div className="flex flex-col items-center gap-6 py-2">
          {/* Progress Circle Container */}
          <div className="relative flex size-32 items-center justify-center">
            {/* SVG */}
            <svg className="absolute inset-0 size-full -rotate-90 transform">
              {/* Background Track (Light Gray) */}
              <circle
                className="text-slate-100"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="64"
                cy="64"
              />
              {/* Progress Bar (Dark) */}
              <circle
                className="text-slate-900 transition-all duration-1000 ease-linear"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r={radius}
                cx="64"
                cy="64"
              />
            </svg>

            {/* Timer Text */}
            <div className="z-10 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {formatTime(timeRemaining)}
              </span>
              <span className="text-xs text-slate-500">remaining</span>
            </div>
          </div>

          <div className="space-y-1 text-center">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Taking a quick break
            </h2>
            <p className="text-sm text-slate-500">
              Your token budget will refresh soon
            </p>
          </div>

          {feedbackResult ? (
            <div
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl p-4",
                feedbackResult.success
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600",
              )}
            >
              <span className="text-lg">
                {feedbackResult.success ? "✓" : "✕"}
              </span>
              <p className="text-sm font-medium">{feedbackResult.message}</p>
            </div>
          ) : canProvideFeedback ? (
            <div className="w-full space-y-4 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  Quick feedback?
                </p>
                <span className="rounded-full bg-slate-900/10 px-2.5 py-0.5 text-xs font-medium text-slate-900">
                  +5,000 tokens
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Would you recommend Miso to a friend?
                </p>

                <div className="grid grid-cols-11 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      onClick={() => setSelectedScore(score)}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition-all",
                        "hover:scale-105 active:scale-95",
                        selectedScore === score
                          ? score <= 6
                            ? "bg-rose-500 text-white shadow-sm"
                            : score <= 8
                              ? "bg-amber-500 text-white shadow-sm"
                              : "bg-emerald-500 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      {score}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>

              <Button
                onClick={handleFeedbackSubmit}
                disabled={selectedScore === null || isSubmitting}
                className="w-full bg-slate-900 text-white hover:bg-slate-800"
                size="sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Submitting...
                  </span>
                ) : (
                  "Submit & claim tokens"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-4">
              <span className="text-lg text-slate-400">✓</span>
              <p className="text-sm text-slate-500">
                You've already received bonus tokens this period
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            className="dark:hover:bg-accent dark:hover:text-accent-foreground w-full text-slate-600 hover:text-slate-900 focus-visible:ring-0"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
