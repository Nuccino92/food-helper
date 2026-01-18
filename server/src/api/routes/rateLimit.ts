import { Router, Request, Response } from "express";
import {
  getRateLimitStatus,
  grantFeedbackBonus,
  storeFeedback,
  generateIdentifier,
} from "../../services/rateLimit";

const router = Router();

export default (app: Router) => {
  app.use("/rate-limit", router);

  // GET /api/rate-limit/status - Get current rate limit status
  router.get("/status", async (req: Request, res: Response) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const fingerprint = req.headers["x-fingerprint"] as string | undefined;
      const identifier = generateIdentifier(ip, fingerprint);

      const status = await getRateLimitStatus(identifier);

      res.json({
        remaining: status.remaining,
        limit: status.limit,
        reset: status.reset,
        resetIn: Math.max(0, Math.ceil((status.reset - Date.now()) / 1000)),
        canProvideFeedback: status.canProvideFeedback,
      });
    } catch (error) {
      console.error("Rate limit status error:", error);
      res.status(500).json({ error: "Failed to get rate limit status" });
    }
  });

  // POST /api/rate-limit/feedback - Submit feedback and receive bonus tokens
  router.post("/feedback", async (req: Request, res: Response) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const fingerprint = req.headers["x-fingerprint"] as string | undefined;
      const identifier = generateIdentifier(ip, fingerprint);

      const { score, sessionContext } = req.body;

      // Validate NPS score (0-10)
      if (typeof score !== "number" || score < 0 || score > 10) {
        res.status(400).json({ error: "Score must be a number between 0 and 10" });
        return;
      }

      // Store the feedback
      await storeFeedback(identifier, score, sessionContext);

      // Grant bonus tokens
      const result = await grantFeedbackBonus(identifier);

      res.json({
        success: result.success,
        message: result.message,
        newRemaining: result.newRemaining,
      });
    } catch (error) {
      console.error("Feedback submission error:", error);
      res.status(500).json({ error: "Failed to process feedback" });
    }
  });
};
