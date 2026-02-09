<p align="center">
  <img src="client/public/miso-icon.png" alt="Miso" width="140" />
</p>

<h1 align="center">Miso Food Aid</h1>

<p align="center">
  An AI-powered conversational app that solves food decision paralysis.
</p>

<p align="center">
  <a href="https://misohungry.ca"><strong>misohungry.ca</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-58c4dc?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Express-5-000?logo=express" alt="Express 5" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Vercel_AI_SDK-6-000?logo=vercel" alt="Vercel AI SDK" />
  <img src="https://img.shields.io/badge/Claude-Haiku_4.5-d4a574?logo=anthropic" alt="Claude Haiku" />
  <img src="https://img.shields.io/badge/TanStack_Router-1-e4572e" alt="TanStack Router" />
  <img src="https://img.shields.io/badge/Radix_UI-1-161618?logo=radixui" alt="Radix UI" />
  <img src="https://img.shields.io/badge/Upstash_Redis-1-00e9a3?logo=upstash" alt="Upstash Redis" />
</p>

---

## The Problem

"What do you want to eat?" "I don't know, what do *you* want?"

Miso isn't a recipe search engine. It's a **mediator** for people (often families or groups) who are stuck in food indecision. The flow is simple:

1. **Resolve indecision** &mdash; Miso helps narrow down what you actually want through conversation
2. **Execute the decision** &mdash; Once decided, get a recipe to cook it or find a restaurant that serves it

## Features

### Three Distinct AI Personas

Each persona has a unique personality, communication style, and color theme &mdash; powered by the same underlying AI with custom system prompts.

| Persona | Style | Theme |
|---------|-------|-------|
| **Miso** | Practical, friendly, efficient &mdash; helps you cut through indecision | Teal |
| **Chef G** | Commanding British chef &mdash; zero tolerance for dithering, decides for you | Rose |
| **Sancho** | Dry, reluctant waiter &mdash; deadpan honesty, always delivers anyway | Amber |

### AI Tool Use

The AI can invoke tools mid-conversation based on context:

- **Recipe Search** &mdash; Finds recipes via the Spoonacular API, filtered by diet, cuisine, cook time, and more. Deduplicates results across a session so you always see something new.
- **Restaurant Finder** &mdash; Searches chain restaurant menus for items matching dietary needs (keto, vegan, macros). Framed as inspiration for local searching.
- **Decision Roulette** &mdash; An interactive slot-machine spinner with physics-based deceleration and confetti. The AI generates 2&ndash;6 food options from the conversation, the client animates the pick, and the result feeds back into the conversation.
- **Abuse Detection** &mdash; AI-triggered lockout for spam, prompt injection, or harassment. Conservative &mdash; one odd message won't trigger it.

### Image Understanding

Upload or paste photos of your fridge, pantry, or a dish. The AI analyzes what's available and suggests what you can make with it.

### Streaming Chat

Real-time token streaming via the Vercel AI SDK with tool invocations appearing inline as interactive UI components (recipe cards, roulette modals).

### Rate Limiting

Dual-layer system (burst protection + token budget) using Upstash Redis. Includes a soft-block modal with countdown timer and an NPS feedback mechanism that grants bonus tokens.

## Tech Stack

### Client
- **React 19** with the [React Compiler](https://react.dev/learn/react-compiler) for automatic memoization
- **Vite** (rolldown-vite) &mdash; Rust-based bundler
- **TanStack Router** &mdash; file-based routing with automatic code splitting
- **Tailwind CSS 4** + **Radix UI** primitives
- **Vercel AI SDK** (`@ai-sdk/react`) &mdash; `useChat` hook for streaming
- **react-markdown** with syntax highlighting for formatted AI responses

### Server
- **Express 5** with layered architecture (loaders &rarr; routes &rarr; services &rarr; tools)
- **Vercel AI SDK** (`@ai-sdk/anthropic`) &mdash; `streamText` with tool definitions
- **Claude Haiku 4.5** as the underlying model
- **Spoonacular API** for recipe and restaurant data
- **Upstash Redis** for serverless rate limiting

## Architecture

```
miso-food-aid/
├── client/                  # React frontend
│   └── src/
│       ├── routes/          # File-based routing (TanStack Router)
│       ├── features/chat/   # Chat feature module
│       │   ├── components/  # ChatInterface, RecipeCard, DecisionRoulette, ...
│       │   └── hooks/       # useChatSession, useRateLimit, useImageUpload, ...
│       ├── components/ui/   # Radix-based design system
│       ├── context/         # Persona + Theme providers
│       └── data/            # Quick-select prompt suggestions
│
└── server/                  # Express backend
    └── src/
        ├── api/routes/      # chat stream, rate limit status/feedback
        ├── services/        # Rate limiting business logic
        ├── personas/        # System prompts (Miso, Chef G, Sancho) + shared base rules
        └── tools/           # searchRecipes, findRestaurants, decisionRoulette, flagAbuse
```

## Getting Started

### Prerequisites

- Node.js 18+
- [Anthropic API key](https://console.anthropic.com/)
- [Spoonacular API key](https://spoonacular.com/food-api)
- (Optional) [Upstash Redis](https://upstash.com/) for rate limiting

### Setup

```bash
# Clone the repo
git clone https://github.com/<your-username>/miso-food-aid.git
cd miso-food-aid

# Install dependencies
cd client && npm install && cd ..
cd server && npm install && cd ..
```

Create environment files:

**`server/.env`**
```env
ANTHROPIC_API_KEY=your-key-here
SPOONACULAR_API_KEY=your-key-here
PORT=8000
ALLOWED_ORIGIN=http://localhost:5173

# Optional — set to "false" to disable rate limiting
RATE_LIMIT_ENABLED=false
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:8000/api
```

### Run

```bash
# Terminal 1 — server
cd server && npm run dev

# Terminal 2 — client
cd client && npm run dev
```

The client runs at `http://localhost:5173` and the server at `http://localhost:8000`.

## Testing

```bash
# Client
cd client && npm test

# Server
cd server && npm test
```

## License

MIT
