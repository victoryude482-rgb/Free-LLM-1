<p align="center">
  <h1 align="center">Cognexa — AI Workspace powered by Free LLMs</h1>
  <p align="center"><strong>A ChatGPT/Claude-style AI workspace with automatic model fallback, memory, MCP and multi-agent coding.</strong></p>
</p>

## What is Cognexa?

Cognexa turns the Free-LLM provider directory into an AI application. Connect multiple compatible LLM providers and use one workspace for chat, coding, memory, MCP tools and multi-agent planning.

### Core features
- 💬 AI chat workspace
- 🔄 Automatic fallback when a model/provider is rate-limited, exhausted, unavailable or times out
- 🧠 Project/conversation memory
- 🧩 MCP tool discovery and execution gateway
- 🤖 Multi-agent coding Taskmaster: Planner, Architect, Coder, Reviewer and Tester
- 📋 Dependency-aware task planning with parallel-ready work
- 🔐 API keys remain client-side and are never committed to this repository
- 📱 Responsive web UI

## Run

```bash
npm install
npm start
```

Then open `http://localhost:10000`.

## Repository role

The repository's provider/model data remains the source directory for free LLM options. Cognexa is the application layer that routes requests through the providers selected by the user.

> Free-tier limits and provider availability change over time. Always verify provider terms.
