# Rate Limiting

Miso Food Aid implements token-based rate limiting to prevent abuse and manage LLM costs. This document covers the architecture, configuration, and usage of the rate limiting system.

## Overview

The rate limiting system uses a **dual-layer approach**:

1. **Burst Protection**: Limits requests per minute (RPM) to prevent rapid-fire abuse
2. **Token Budget**: Limits total token usage per hour to control costs

### Why Token-Based?

LLM costs are variable - a simple "hi" costs ~50 tokens while a complex recipe search with dietary restrictions can cost 5,000+ tokens. Token-based limiting aligns rate limits with actual resource consumption.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Client Request                                              │
├─────────────────────────────────────────────────────────────┤
│  0. Abuse Lock Check                                         │
│     └─ Reject immediately if AI-triggered lockout is active  │
├─────────────────────────────────────────────────────────────┤
│  1. Burst Check (20 req/min)                                │
│     └─ Fast, cheap check to stop obvious abuse              │
├─────────────────────────────────────────────────────────────┤
│  2. Token Pre-Check                                         │
│     └─ Estimate input tokens, verify budget available       │
├─────────────────────────────────────────────────────────────┤
│  3. AI Processing (if checks pass)                          │
├─────────────────────────────────────────────────────────────┤
│  4. Token Deduction (after response)                        │
│     └─ Deduct actual tokens used from budget                │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_ENABLED` | No | `"true"` | Set to `"false"` to disable rate limiting |
| `UPSTASH_REDIS_REST_URL` | Yes* | - | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes* | - | Upstash Redis REST token |

*Required only when rate limiting is enabled.

### Default Limits

| Limit | Value | Window |
|-------|-------|--------|
| Burst Protection | 20 requests | 1 minute |
| Token Budget | 10,000 tokens | 1 hour (rolling) |
| Feedback Bonus | 5,000 tokens | Once per cooldown period |

### Disabling for Development

Set `RATE_LIMIT_ENABLED=false` in your `.env` file:

```env
# Disable rate limiting for local development
RATE_LIMIT_ENABLED = "false"
```

If Redis credentials are missing, rate limiting auto-disables with the same bypass behavior.

## User Identification

Users are identified by a **fingerprint + IP hybrid**:

```
identifier = `${ip}:${fingerprint}`
```

- **IP Address**: From `req.ip` or `req.socket.remoteAddress`
- **Fingerprint**: Browser-generated hash stored in `localStorage`, sent via `x-fingerprint` header

This approach:
- Survives IP changes (fingerprint persists)
- Handles shared IPs better than IP-only
- Is more resilient to simple bypasses than IP-only

## API Endpoints

### GET `/api/rate-limit/status`

Returns the current rate limit status for the user.

**Headers:**
- `x-fingerprint` (optional): Browser fingerprint

**Response:**
```json
{
  "remaining": 7500,
  "limit": 10000,
  "reset": 1705420800000,
  "resetIn": 2400,
  "canProvideFeedback": true
}
```

### POST `/api/rate-limit/feedback`

Submit NPS feedback and receive bonus tokens.

**Headers:**
- `x-fingerprint` (optional): Browser fingerprint
- `Content-Type`: `application/json`

**Body:**
```json
{
  "score": 8,
  "sessionContext": "optional context about the session"
}
```

**Response (success):**
```json
{
  "success": true,
  "message": "You've been granted 5,000 bonus tokens!",
  "newRemaining": 12500
}
```

**Response (already claimed):**
```json
{
  "success": false,
  "message": "You've already received bonus tokens this period.",
  "newRemaining": 7500
}
```

## Error Responses

When rate limited, the chat endpoint returns:

### Burst Limit Exceeded (429)
```json
{
  "error": "rate_limit",
  "type": "burst",
  "message": "Too many requests. Please slow down.",
  "reset": 1705420800000
}
```

### Token Budget Exceeded (429)
```json
{
  "error": "rate_limit",
  "type": "tokens",
  "message": "You've used your token budget for this hour.",
  "remaining": 0,
  "limit": 10000,
  "reset": 1705420800000
}
```

## Abuse Lock

The AI can trigger a user lockout via the `flagAbuse` tool when it detects clear abuse patterns:

- 3+ consecutive gibberish/nonsensical messages
- Prompt injection or jailbreak attempts
- Repeated spam of the same message
- Hostile/harassing content unrelated to food

When triggered, the user is locked out for the remainder of the rate limit window (~1 hour). The lock is stored as a simple Redis key with a TTL.

### Chat endpoint behavior

The abuse lock is checked **before** burst and token checks. If locked, the endpoint returns a 429 with `remaining: 0`.

### Status endpoint behavior

When a user is abuse-locked, the `/api/rate-limit/status` endpoint returns `remaining: 0` and `canProvideFeedback: false`, using the lock's reset time.

### Feedback endpoint behavior

Abuse-locked users receive a 403 when attempting to submit feedback.

## Client Integration

### useRateLimit Hook

The `useRateLimit` hook manages rate limit state on the client:

```tsx
import { useRateLimit } from "@/features/chat/hooks/useRateLimit";

function MyComponent() {
  const {
    status,           // Current rate limit status
    isLimited,        // Boolean: is user rate limited?
    showModal,        // Boolean: should modal be shown?
    error,            // Last rate limit error
    fetchStatus,      // Refresh status from server
    submitFeedback,   // Submit NPS feedback
    closeModal,       // Close the rate limit modal
    getHeaders,       // Get headers for API requests
  } = useRateLimit();

  // Check remaining tokens
  if (status?.remaining < 1000) {
    console.log("Running low on tokens!");
  }
}
```

### RateLimitModal Component

A soft-block modal that appears when users hit their limit:

```tsx
<RateLimitModal
  isOpen={rateLimit.showModal}
  onClose={rateLimit.closeModal}
  resetTime={rateLimit.status?.reset ?? Date.now() + 3600000}
  canProvideFeedback={rateLimit.status?.canProvideFeedback ?? false}
  onFeedbackSubmit={rateLimit.submitFeedback}
/>
```

Features:
- **Soft block**: Users can dismiss and browse previous messages
- **Countdown timer**: Shows time until reset
- **Feedback for tokens**: NPS survey grants 5,000 bonus tokens

## Token Estimation

Tokens are estimated using character count:

```typescript
// ~4 characters per token for English text
const estimatedTokens = Math.ceil(text.length / 4);
```

Pre-check adds a 2,000 token buffer for system prompt and expected response:

```typescript
const estimatedTotalTokens = estimatedInputTokens + 2000;
```

## Feedback Storage

NPS feedback is stored in Redis for later analysis:

```
Key: feedback:nps (Redis List)
Value: JSON array of feedback objects
```

Each feedback entry:
```json
{
  "identifier": "127.0.0.1:abc123",
  "score": 8,
  "sessionContext": "...",
  "timestamp": 1705420800000
}
```

## Redis Key Schema

| Key Pattern | Type | TTL | Description |
|-------------|------|-----|-------------|
| `ratelimit:tokens:{identifier}` | Number | 1 hour | Token usage count |
| `ratelimit:burst:{identifier}` | Number | 1 minute | Burst request count |
| `abuse:lock:{identifier}` | Boolean | 1 hour | AI-triggered abuse lockout |
| `feedback:granted:{identifier}` | Boolean | 1 hour | Feedback bonus claimed |
| `feedback:nps` | List | None | All NPS feedback entries |

## Monitoring

### Upstash Analytics

Enable analytics in the rate limiter for Upstash dashboard insights:

```typescript
const tokenLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10000, "1 h"),
  analytics: true,  // Enables Upstash analytics
});
```

## Customization

### Adjusting Limits

Modify constants in `server/src/services/rateLimit.ts`:

```typescript
const TOKEN_BUDGET = 10000;    // tokens per hour
const FEEDBACK_BONUS = 5000;   // bonus tokens for feedback
```

Modify rate limiter windows:

```typescript
// 10,000 tokens per hour
Ratelimit.slidingWindow(10000, "1 h")

// 20 requests per minute
Ratelimit.slidingWindow(20, "1 m")
```

### Adding Tiered Limits

For future user tiers, modify `checkTokenBudget` to accept a custom limit:

```typescript
export async function checkTokenBudget(
  identifier: string,
  estimatedTokens: number,
  customLimit?: number  // For premium users
): Promise<...> {
  const limit = customLimit ?? TOKEN_BUDGET;
  // ...
}
```

## Troubleshooting

### "Rate limiting is DISABLED" in production

1. Verify `RATE_LIMIT_ENABLED` is not set to `"false"`
2. Check that `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
3. Verify credentials are valid at [console.upstash.com](https://console.upstash.com)

### Users being rate limited too quickly

1. Check if burst limit (20/min) is too aggressive
2. Verify token estimation is accurate for your use case
3. Consider increasing the 2,000 token buffer for longer conversations

### Modal not appearing on rate limit

1. Verify `x-fingerprint` header is being sent
2. Check browser console for errors in `useRateLimit` hook
3. Ensure `RateLimitModal` is rendered in component tree
