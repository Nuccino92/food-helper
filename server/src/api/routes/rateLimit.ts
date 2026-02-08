import { Router, Request, Response } from "express";
import {
  checkAbuseLock,
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

      const [status, abuseLock] = await Promise.all([
        getRateLimitStatus(identifier),
        checkAbuseLock(identifier),
      ]);

      res.json({
        remaining: abuseLock.locked ? 0 : status.remaining,
        limit: status.limit,
        reset: abuseLock.locked ? abuseLock.reset : status.reset,
        resetIn: abuseLock.locked
          ? Math.max(0, Math.ceil((abuseLock.reset - Date.now()) / 1000))
          : Math.max(0, Math.ceil((status.reset - Date.now()) / 1000)),
        canProvideFeedback: abuseLock.locked ? false : status.canProvideFeedback,
      });
    } catch {
      res.status(500).json({ error: "Failed to get rate limit status" });
    }
  });

  // POST /api/rate-limit/feedback - Submit feedback and receive bonus tokens
  router.post("/feedback", async (req: Request, res: Response) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const fingerprint = req.headers["x-fingerprint"] as string | undefined;
      const identifier = generateIdentifier(ip, fingerprint);

      // Block feedback if user is abuse-locked
      const abuseLock = await checkAbuseLock(identifier);
      if (abuseLock.locked) {
        res.status(403).json({
          success: false,
          message: "Feedback is unavailable during a lockout.",
        });
        return;
      }

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
    } catch {
      res.status(500).json({ error: "Failed to process feedback" });
    }
  });
};
