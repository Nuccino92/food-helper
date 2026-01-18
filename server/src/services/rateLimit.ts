import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Configuration
const TOKEN_BUDGET = 10000; // tokens per hour
const FEEDBACK_BONUS = 5000; // tokens granted for feedback
const FEEDBACK_COOLDOWN_KEY_PREFIX = "feedback:granted:";

// Check if rate limiting is enabled
// Set RATE_LIMIT_ENABLED=false to disable in development
const isRateLimitEnabled = process.env.RATE_LIMIT_ENABLED !== "false";

// Initialize Redis client only if rate limiting is enabled and credentials exist
const hasRedisConfig =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Token-based rate limiter: 10,000 tokens per hour with sliding window
const tokenLimiter =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10000, "1 h"),
    prefix: "ratelimit:tokens",
    analytics: true,
  });

// Burst protection: 20 requests per minute (cheap pre-check)
const burstLimiter =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "ratelimit:burst",
  });

// Log rate limit status on startup
if (!isRateLimitEnabled) {
  console.log("⚠️  Rate limiting is DISABLED (RATE_LIMIT_ENABLED=false)");
} else if (!hasRedisConfig) {
  console.log(
    "⚠️  Rate limiting is DISABLED (missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN)",
  );
} else {
  console.log("✅ Rate limiting is ENABLED");
}

// Simple token estimation based on character count
// Claude uses ~4 characters per token on average for English
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Generate a unique identifier combining IP and fingerprint
export function generateIdentifier(ip: string, fingerprint?: string): string {
  if (fingerprint) {
    return `${ip}:${fingerprint}`;
  }
  return ip;
}

// Check burst limit (request count)
export async function checkBurstLimit(
  identifier: string,
): Promise<{ success: boolean; reset: number }> {
  // Bypass if rate limiting is disabled
  if (!isRateLimitEnabled || !burstLimiter) {
    return { success: true, reset: Date.now() + 60000 };
  }

  const result = await burstLimiter.limit(identifier);
  return {
    success: result.success,
    reset: result.reset,
  };
}

// Check if user has enough tokens for a request
export async function checkTokenBudget(
  identifier: string,
  estimatedTokens: number,
): Promise<{
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
}> {
  // Bypass if rate limiting is disabled
  if (!isRateLimitEnabled || !redis) {
    return {
      allowed: true,
      remaining: TOKEN_BUDGET,
      reset: Date.now() + 3600000,
      limit: TOKEN_BUDGET,
    };
  }

  // Get current usage without consuming
  const currentUsage = await redis.get<number>(
    `ratelimit:tokens:${identifier}`,
  );
  const used = currentUsage || 0;
  const remaining = Math.max(0, TOKEN_BUDGET - used);

  // Get TTL for reset time
  const ttl = await redis.ttl(`ratelimit:tokens:${identifier}`);
  const reset = ttl > 0 ? Date.now() + ttl * 1000 : Date.now() + 3600000;

  return {
    allowed: remaining >= estimatedTokens,
    remaining,
    reset,
    limit: TOKEN_BUDGET,
  };
}

// Deduct tokens after a successful response
export async function deductTokens(
  identifier: string,
  tokensUsed: number,
): Promise<{ remaining: number; reset: number }> {
  // Bypass if rate limiting is disabled
  if (!isRateLimitEnabled || !tokenLimiter) {
    return { remaining: TOKEN_BUDGET, reset: Date.now() + 3600000 };
  }

  const result = await tokenLimiter.limit(identifier, { rate: tokensUsed });
  return {
    remaining: result.remaining,
    reset: result.reset,
  };
}

// Get current rate limit status without consuming
export async function getRateLimitStatus(identifier: string): Promise<{
  remaining: number;
  limit: number;
  reset: number;
  canProvideFeedback: boolean;
}> {
  // Return unlimited status if rate limiting is disabled
  if (!isRateLimitEnabled || !redis) {
    return {
      remaining: TOKEN_BUDGET,
      limit: TOKEN_BUDGET,
      reset: Date.now() + 3600000,
      canProvideFeedback: false, // No feedback needed when unlimited
    };
  }

  const key = `ratelimit:tokens:${identifier}`;
  const feedbackKey = `${FEEDBACK_COOLDOWN_KEY_PREFIX}${identifier}`;

  const [currentUsage, ttl, feedbackGranted] = await Promise.all([
    redis.get<number>(key),
    redis.ttl(key),
    redis.get<boolean>(feedbackKey),
  ]);

  const used = currentUsage || 0;
  const remaining = Math.max(0, TOKEN_BUDGET - used);
  const reset = ttl > 0 ? Date.now() + ttl * 1000 : Date.now() + 3600000;

  return {
    remaining,
    limit: TOKEN_BUDGET,
    reset,
    canProvideFeedback: !feedbackGranted,
  };
}

// Grant bonus tokens for feedback (once per cooldown period)
export async function grantFeedbackBonus(identifier: string): Promise<{
  success: boolean;
  newRemaining: number;
  message: string;
}> {
  // No-op if rate limiting is disabled
  if (!isRateLimitEnabled || !redis) {
    return {
      success: false,
      newRemaining: TOKEN_BUDGET,
      message: "Rate limiting is disabled.",
    };
  }

  const feedbackKey = `${FEEDBACK_COOLDOWN_KEY_PREFIX}${identifier}`;
  const tokenKey = `ratelimit:tokens:${identifier}`;

  // Check if feedback was already granted this period
  const alreadyGranted = await redis.get<boolean>(feedbackKey);
  if (alreadyGranted) {
    const status = await getRateLimitStatus(identifier);
    return {
      success: false,
      newRemaining: status.remaining,
      message: "You've already received bonus tokens this period.",
    };
  }

  // Get current usage and TTL
  const [currentUsage, ttl] = await Promise.all([
    redis.get<number>(tokenKey),
    redis.ttl(tokenKey),
  ]);

  const used = currentUsage || 0;
  const expiresIn = ttl > 0 ? ttl : 3600; // Default to 1 hour if no TTL

  // Reduce the usage count (effectively granting tokens)
  const newUsage = Math.max(0, used - FEEDBACK_BONUS);
  await Promise.all([
    redis.set(tokenKey, newUsage, { ex: expiresIn }),
    redis.set(feedbackKey, true, { ex: expiresIn }), // Mark feedback as granted
  ]);

  const newRemaining = TOKEN_BUDGET - newUsage;

  return {
    success: true,
    newRemaining,
    message: `You've been granted ${FEEDBACK_BONUS.toLocaleString()} bonus tokens!`,
  };
}

// Store NPS feedback
export async function storeFeedback(
  identifier: string,
  score: number,
  sessionContext?: string,
): Promise<void> {
  // No-op if rate limiting/Redis is disabled
  if (!isRateLimitEnabled || !redis) {
    console.log("[Feedback] Rate limiting disabled, skipping storage:", {
      score,
      sessionContext,
    });
    return;
  }

  const feedbackData = {
    identifier,
    score,
    sessionContext,
    timestamp: Date.now(),
  };

  // Store in a Redis list for later analysis
  await redis.lpush("feedback:nps", JSON.stringify(feedbackData));
}
