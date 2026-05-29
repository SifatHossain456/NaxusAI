# NexusAI — AI Chat Powered by Claude

A polished, multi-model AI chat interface built on top of the Anthropic Claude API. Select between Haiku, Sonnet, and Opus, manage multiple conversations, and stream responses in real time.

## Features

- **Multi-model support** — Claude Haiku (fast), Claude Sonnet (balanced), Claude Opus (powerful)
- **Conversation sidebar** — full chat history with per-conversation titles auto-generated from the first message
- **Streaming responses** — tokens stream in as they are generated, no waiting for the full response
- **Message history** — full multi-turn context sent to the API for coherent long conversations
- **Model selector** — switch models mid-session with a single click
- **Keyboard shortcuts** — `Enter` to send, `Shift+Enter` for newline
- **New conversation** — start fresh at any time without losing history

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Styling | Tailwind CSS v4 + CSS variables |
| AI | Anthropic Claude API (streaming) |
| State | React `useReducer` |

## Getting Started

```bash
git clone https://github.com/SifatHossain456/nexusai.git
cd nexusai
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Get your API key at [console.anthropic.com](https://console.anthropic.com).

## Models

| Model ID | Label | Best For |
|----------|-------|----------|
| `claude-haiku-4-5-20251001` | Claude Haiku | Fast responses, simple tasks |
| `claude-sonnet-4-6` | Claude Sonnet | Most tasks, best balance |
| `claude-opus-4-7` | Claude Opus | Complex reasoning, deep analysis |

## License

MIT
