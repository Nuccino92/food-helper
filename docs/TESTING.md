# Testing

Both client and server use [Vitest](https://vitest.dev/) as the test runner.

```bash
# Run server tests
cd server && npm test

# Run client tests
cd client && npm test
```

## Server Tests

### Rate Limit Service (`services/rateLimit.test.ts`)

Tests the dual-layer rate limiting system. Since Redis isn't available in tests, all cases run with rate limiting disabled or with missing credentials — verifying the bypass paths return correct defaults.

- **Pure functions** — `estimateTokens` (character-to-token math) and `generateIdentifier` (IP + fingerprint concatenation)
- **Disabled mode** — every rate limit function (`checkBurstLimit`, `checkTokenBudget`, `deductTokens`, `getRateLimitStatus`, `grantFeedbackBonus`, `storeFeedback`) returns safe defaults when `RATE_LIMIT_ENABLED=false`
- **Missing credentials** — behaves the same as disabled when Redis URL/token are absent
- **Reset times** — burst resets are ~1 minute out, token budget resets are ~1 hour out

### Persona Builder (`personas/index.test.ts`)

Tests that `buildSystemPrompt` correctly assembles system prompts from persona definitions and base rules.

- Each persona ID (`assistant-miso`, `assistant-gordon`, `assistant-sancho`) loads the right personality
- Unknown persona IDs fall back to Miso
- Base behavioral rules are always included
- User local time is injected (or shows "Unknown" when missing)

### AI Tools

**Decision Roulette** (`tools/decisionRoulette.test.ts`) — the tool is a pure pass-through (client handles animation), so tests verify it returns options unchanged.

**Find Restaurants** (`tools/findRestaurants.test.ts`) — tests the Spoonacular Menu Items API integration with mocked `fetch`:

- Successful responses are mapped to a clean `{ name, restaurant, image, nutrition }` shape
- Empty results return a failure with a location-aware search tip
- API errors are caught and return a graceful fallback
- Missing API key throws immediately

## Client Tests

### Rate Limit Modal (`components/RateLimitModal.test.tsx`)

Tests the soft-block modal that appears when users hit their token budget. Uses `@testing-library/react` for DOM assertions.

- **Rendering** — opens/closes based on `isOpen`, shows countdown timer, conditionally shows feedback form vs. "already claimed" message
- **NPS scoring** — all 11 buttons (0-10) render, correct color classes apply per tier (rose for detractors 0-6, amber for passives 7-8, emerald for promoters 9-10)
- **Feedback flow** — submit button disables without selection, calls `onFeedbackSubmit` with the score, shows success/error/loading states
- **Close behavior** — footer close button triggers `onClose`
- **Countdown** — timer updates every second using real timers

### Rate Limit Hook (`hooks/useRateLimit.test.ts`)

Tests the `useRateLimit` hook using `renderHook` with mocked `fetch` and `localStorage`.

- **Fingerprint** — uses stored fingerprint from localStorage, generates and persists a new one if missing
- **Status fetching** — fetches on mount with fingerprint header, sets `isLimited` when remaining is 0, handles network errors silently
- **Error handling** — `handleRateLimitError` sets modal visibility and updates local status
- **Feedback submission** — submits score via POST, updates remaining tokens on success, handles network failures
- **Utilities** — `closeModal` toggles visibility, `getHeaders` returns fingerprint header

### Recipe Card (`components/RecipeCard.test.tsx`)

Tests the recipe card component renders correctly from tool output data.

- Displays title, cook time badge, and recipe image with alt text
- Links to source URL in a new tab with `noopener noreferrer`
- Returns null for falsy recipe prop (defensive guard)
