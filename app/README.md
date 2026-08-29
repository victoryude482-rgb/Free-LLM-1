# Cognexa

A ChatGPT-style AI chat application built with Next.js App Router, TypeScript and Tailwind CSS. The default backend is Groq's OpenAI-compatible API.

## Setup

```bash
cd app
npm install
cp .env.example .env.local
npm run dev
```

Create a free Groq API key at https://console.groq.com/keys and put it in `GROQ_API_KEY`. Never commit `.env.local`.

`AI_PROVIDER=groq` and `AI_MODEL=llama-3.3-70b-versatile` are the defaults. The provider/model variables are intentionally isolated so a Gemini or OpenRouter adapter can be added later.

## Vercel

Import the repository into Vercel, set the **Root Directory** to `app`, add `GROQ_API_KEY`, `AI_PROVIDER=groq`, and `AI_MODEL=llama-3.3-70b-versatile`, then deploy. Do not put the real key in GitHub.

## Features

- Streaming chat completions
- ChatGPT-style responsive UI
- New chat and localStorage history
- Rename/delete-ready chat data model
- Markdown and GFM rendering
- Editable system prompt
- Provider/model environment configuration
- No real secrets committed
