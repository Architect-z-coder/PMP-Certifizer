"""Provider-agnostic LLM client. One env var (LLM_PROVIDER) switches between
free (gemini, groq) and paid (anthropic) backends. All via plain HTTP, no SDKs."""
import httpx

from .config import settings

TIMEOUT = httpx.Timeout(60.0)


async def chat(system: str, messages: list[dict], max_tokens: int = 1000) -> str:
    provider = settings.llm_provider.lower()
    if provider == "gemini":
        return await _gemini(system, messages, max_tokens)
    if provider == "groq":
        return await _groq(system, messages, max_tokens)
    if provider == "anthropic":
        return await _anthropic(system, messages, max_tokens)
    raise ValueError(f"Unknown LLM_PROVIDER: {settings.llm_provider}")


# ---- Google Gemini (free tier) ----
async def _gemini(system: str, messages: list[dict], max_tokens: int) -> str:
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    )
    contents = [
        {"role": ("model" if m["role"] == "assistant" else "user"),
         "parts": [{"text": m["content"]}]}
        for m in messages
    ]
    body = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": max_tokens, "temperature": 0.6},
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(url, json=body)
        r.raise_for_status()
        data = r.json()
    cands = data.get("candidates", [])
    if not cands:
        return "…"
    parts = cands[0].get("content", {}).get("parts", [])
    return "".join(p.get("text", "") for p in parts).strip() or "…"


# ---- Groq (free tier, OpenAI-compatible) ----
async def _groq(system: str, messages: list[dict], max_tokens: int) -> str:
    if not settings.groq_api_key:
        raise RuntimeError("GROQ_API_KEY is not set")
    body = {
        "model": settings.groq_model,
        "max_tokens": max_tokens,
        "temperature": 0.6,
        "messages": [{"role": "system", "content": system}] + messages,
    }
    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post("https://api.groq.com/openai/v1/chat/completions", json=body, headers=headers)
        r.raise_for_status()
        data = r.json()
    return data["choices"][0]["message"]["content"].strip() or "…"


# ---- Anthropic (paid / premium) ----
async def _anthropic(system: str, messages: list[dict], max_tokens: int) -> str:
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    body = {
        "model": settings.anthropic_model,
        "max_tokens": max_tokens,
        "system": system,
        "messages": messages,
    }
    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post("https://api.anthropic.com/v1/messages", json=body, headers=headers)
        r.raise_for_status()
        data = r.json()
    blocks = [b.get("text", "") for b in data.get("content", []) if b.get("type") == "text"]
    return "\n".join(blocks).strip() or "…"
