import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RateLimitModal } from "./RateLimitModal";

describe("RateLimitModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    resetTime: Date.now() + 3600000, // 1 hour from now
    canProvideFeedback: true,
    onFeedbackSubmit: vi.fn().mockResolvedValue({
      success: true,
      message: "You've been granted 5,000 bonus tokens!",
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("should render when isOpen is true", () => {
      render(<RateLimitModal {...defaultProps} />);

      expect(screen.getByText("Taking a quick break")).toBeInTheDocument();
    });

    it("should not render content when isOpen is false", () => {
      render(<RateLimitModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Taking a quick break")).not.toBeInTheDocument();
    });

    it("should show countdown timer", () => {
      const resetTime = Date.now() + 1800000; // 30 minutes
      render(<RateLimitModal {...defaultProps} resetTime={resetTime} />);

      // Timer is initialized via useEffect
      vi.advanceTimersByTime(0);
      expect(screen.getByText(/remaining/)).toBeInTheDocument();
    });

    it("should show feedback option when canProvideFeedback is true", () => {
      render(<RateLimitModal {...defaultProps} canProvideFeedback={true} />);

      expect(
        screen.getByText(/Would you recommend Miso/)
      ).toBeInTheDocument();
      expect(screen.getByText("Submit & claim tokens")).toBeInTheDocument();
    });

    it("should show already claimed message when canProvideFeedback is false", () => {
      render(<RateLimitModal {...defaultProps} canProvideFeedback={false} />);

      expect(
        screen.getByText(/You've already received bonus tokens/)
      ).toBeInTheDocument();
      expect(screen.queryByText("Submit & claim tokens")).not.toBeInTheDocument();
    });
  });

  describe("NPS score selection", () => {
    it("should render all 11 score buttons (0-10)", () => {
      render(<RateLimitModal {...defaultProps} />);

      for (let i = 0; i <= 10; i++) {
        expect(screen.getByRole("button", { name: String(i) })).toBeInTheDocument();
      }
    });

    it("should highlight selected score", () => {
      render(<RateLimitModal {...defaultProps} />);

      const scoreButton = screen.getByRole("button", { name: "8" });
      fireEvent.click(scoreButton);

      // 8 is a passive score (7-8) → amber
      expect(scoreButton).toHaveClass("bg-amber-500");
    });

    it("should apply rose color for detractor scores (0-6)", () => {
      render(<RateLimitModal {...defaultProps} />);

      const scoreButton = screen.getByRole("button", { name: "3" });
      fireEvent.click(scoreButton);

      expect(scoreButton).toHaveClass("bg-rose-500");
    });

    it("should apply emerald color for promoter scores (9-10)", () => {
      render(<RateLimitModal {...defaultProps} />);

      const scoreButton = screen.getByRole("button", { name: "10" });
      fireEvent.click(scoreButton);

      expect(scoreButton).toHaveClass("bg-emerald-500");
    });
  });

  describe("feedback submission", () => {
    it("should disable submit button when no score selected", () => {
      render(<RateLimitModal {...defaultProps} />);

      const submitButton = screen.getByRole("button", { name: "Submit & claim tokens" });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when score is selected", () => {
      render(<RateLimitModal {...defaultProps} />);

      fireEvent.click(screen.getByRole("button", { name: "8" }));

      const submitButton = screen.getByRole("button", { name: "Submit & claim tokens" });
      expect(submitButton).not.toBeDisabled();
    });

    it("should call onFeedbackSubmit with selected score", async () => {
      vi.useRealTimers(); // Need real timers for async operations
      const onFeedbackSubmit = vi.fn().mockResolvedValue({
        success: true,
        message: "Bonus granted!",
      });

      render(
        <RateLimitModal {...defaultProps} onFeedbackSubmit={onFeedbackSubmit} />
      );

      fireEvent.click(screen.getByRole("button", { name: "9" }));
      fireEvent.click(screen.getByRole("button", { name: "Submit & claim tokens" }));

      await waitFor(() => {
        expect(onFeedbackSubmit).toHaveBeenCalledWith(9);
      });
    });

    it("should show success message after successful submission", async () => {
      vi.useRealTimers();
      const onFeedbackSubmit = vi.fn().mockResolvedValue({
        success: true,
        message: "You've been granted 5,000 bonus tokens!",
      });

      render(
        <RateLimitModal {...defaultProps} onFeedbackSubmit={onFeedbackSubmit} />
      );

      fireEvent.click(screen.getByRole("button", { name: "8" }));
      fireEvent.click(screen.getByRole("button", { name: "Submit & claim tokens" }));

      await waitFor(() => {
        expect(screen.getByText(/5,000 bonus tokens/)).toBeInTheDocument();
      });
    });

    it("should show error message after failed submission", async () => {
      vi.useRealTimers();
      const onFeedbackSubmit = vi.fn().mockResolvedValue({
        success: false,
        message: "Already received bonus this period.",
      });

      render(
        <RateLimitModal {...defaultProps} onFeedbackSubmit={onFeedbackSubmit} />
      );

      fireEvent.click(screen.getByRole("button", { name: "8" }));
      fireEvent.click(screen.getByRole("button", { name: "Submit & claim tokens" }));

      await waitFor(() => {
        expect(screen.getByText(/Already received bonus/)).toBeInTheDocument();
      });
    });

    it("should show loading state during submission", async () => {
      vi.useRealTimers();
      let resolveSubmit: (value: { success: boolean; message: string }) => void;
      const onFeedbackSubmit = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSubmit = resolve;
          })
      );

      render(
        <RateLimitModal {...defaultProps} onFeedbackSubmit={onFeedbackSubmit} />
      );

      fireEvent.click(screen.getByRole("button", { name: "8" }));
      fireEvent.click(screen.getByRole("button", { name: "Submit & claim tokens" }));

      await waitFor(() => {
        expect(screen.getByText("Submitting...")).toBeInTheDocument();
      });

      // Resolve the promise
      resolveSubmit!({ success: true, message: "Done!" });

      await waitFor(() => {
        expect(screen.queryByText("Submitting...")).not.toBeInTheDocument();
      });
    });
  });

  describe("close behavior", () => {
    it("should call onClose when Close button is clicked", () => {
      const onClose = vi.fn();
      render(<RateLimitModal {...defaultProps} onClose={onClose} />);

      // Two close buttons exist (Radix X + footer), click the footer one
      const closeButtons = screen.getAllByRole("button", { name: "Close" });
      fireEvent.click(closeButtons[closeButtons.length - 1]);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("countdown timer", () => {
    it("should update countdown every second", async () => {
      vi.useRealTimers();
      const resetTime = Date.now() + 65000; // 1 minute 5 seconds

      render(<RateLimitModal {...defaultProps} resetTime={resetTime} />);

      // Initial time should show ~1:05
      expect(screen.getByText(/1:0[45]/)).toBeInTheDocument();

      // Wait a bit and check it updated
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Should now show ~1:04 or less
      expect(screen.getByText(/1:0[0-4]/)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have accessible dialog title", () => {
      render(<RateLimitModal {...defaultProps} />);

      expect(screen.getByText("Taking a quick break")).toBeInTheDocument();
    });

    it("should have accessible NPS labels", () => {
      render(<RateLimitModal {...defaultProps} />);

      expect(screen.getByText("Not likely")).toBeInTheDocument();
      expect(screen.getByText("Very likely")).toBeInTheDocument();
    });
  });
});
