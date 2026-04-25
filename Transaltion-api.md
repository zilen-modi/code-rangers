# Translation API — Revised Implementation Plan

## Changes Requested

1. **Merge retry into same API** — Remove separate `/translate/retry` endpoint; handle retry inside `POST /translate` using `requestId`
2. **Better models** — Create an **OpenAI adapter** for GPT-4o (text + vision) and Whisper (speech-to-text), which are significantly better than Ollama for translation
3. **API keys / .env** — Provide [.env](file:///Users/santosh/Downloads/code-rangers-antigravity/apps/api/.env) template with placeholders
4. **Multer file.path** — Confirmed: multer v2.1.1 with `diskStorage` sets `file.path` to the full absolute path ✅

---

## Proposed Changes

### 1. Merge Retry Into Single API

Instead of a separate `/translate/retry` endpoint, the single `POST /translate` will:
- If a `requestId` is provided AND **no new file** is uploaded, look up the previously stored file from disk and re-process
- If a `requestId` is provided AND a **new file** IS uploaded, use the new file (overwrite)
- If no `requestId` is provided, generate a new UUID

**Files to modify:**
- [TranslationController.ts](file:///Users/santosh/Downloads/code-rangers-antigravity/apps/api/src/controllers/TranslationController.ts) — Remove [retryTranslation](file:///Users/santosh/Downloads/code-rangers-antigravity/apps/api/src/controllers/TranslationController.ts#87-135), update [translate](file:///Users/santosh/Downloads/code-rangers-antigravity/apps/api/src/services/TranslationService.ts#128-148) to handle retry logic
- [translate.ts](file:///Users/santosh/Downloads/code-rangers-antigravity/apps/api/src/routes/translate.ts) (route) — Remove `/retry` route
- [schemas/index.ts](file:///Users/santosh/Downloads/code-rangers-antigravity/apps/api/src/schemas/index.ts) — Remove `retryTranslateSchema`
- [TranslationService.ts](file:///Users/santosh/Downloads/code-rangers-antigravity/apps/api/src/services/TranslationService.ts) — Fold retry logic into [translate()](file:///Users/santosh/Downloads/code-rangers-antigravity/apps/api/src/services/TranslationService.ts#128-148) method

---

### 2. Create OpenAI Adapter

> [!IMPORTANT]
> **Model recommendation:**
> | Task | OpenAI Model | Why |
> |------|-------------|-----|
> | Text translation | `gpt-4o` | Best multilingual translation quality |
> | Image OCR + translation | `gpt-4o` (vision) | Native image understanding via Chat Completions API |
> | Voice transcription | `whisper-1` | Gold-standard speech-to-text, 99+ language support |
> 
> Ollama models (`llama3`, `llava`) remain as a **fallback** for users without an OpenAI API key.

**New file:** `packages/ai-adapter/src/providers/openaiAdapter.ts`

The OpenAI adapter will implement:
- [generateText()](file:///Users/santosh/Downloads/code-rangers-antigravity/packages/ai-adapter/src/core/baseAdapter.ts#34-35) — via `POST https://api.openai.com/v1/chat/completions`
- [generateVision()](file:///Users/santosh/Downloads/code-rangers-antigravity/packages/ai-adapter/src/providers/ollamaAdapter.ts#197-264) — via same endpoint with image_url content part (base64 data URI)
- [transcribeAudio()](file:///Users/santosh/Downloads/code-rangers-antigravity/apps/api/src/services/TranslationService.ts#287-328) — new method via `POST https://api.openai.com/v1/audio/transcriptions` (Whisper)

**Files to modify:**
- [providers/index.ts](file:///Users/santosh/Downloads/code-rangers-antigravity/packages/ai-adapter/src/providers/index.ts) — Register OpenAI adapter in [getAIAdapter()](file:///Users/santosh/Downloads/code-rangers-antigravity/packages/ai-adapter/src/providers/index.ts#31-45)
- [core/types.ts](file:///Users/santosh/Downloads/code-rangers-antigravity/packages/ai-adapter/src/core/types.ts) — Add `TranscribeAudioInput` / `TranscribeAudioResult` types
- [core/baseAdapter.ts](file:///Users/santosh/Downloads/code-rangers-antigravity/packages/ai-adapter/src/core/baseAdapter.ts) — Add [transcribeAudio()](file:///Users/santosh/Downloads/code-rangers-antigravity/apps/api/src/services/TranslationService.ts#287-328) method (default throws NOT_IMPLEMENTED)

---

### 3. [.env](file:///Users/santosh/Downloads/code-rangers-antigravity/apps/api/.env) Template

```env
# ─── Translation API ───────────────────────────────
# Provider: "openai" (recommended) or "ollama" (free/local)
TRANSLATION_PROVIDER=openai

# OpenAI (required if TRANSLATION_PROVIDER=openai)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Model overrides (defaults shown)
TRANSLATION_TEXT_MODEL=gpt-4o
TRANSLATION_VISION_MODEL=gpt-4o
TRANSLATION_SPEECH_MODEL=whisper-1

# Ollama fallback (no API key needed, must have Ollama running locally)
# OLLAMA_MODEL=llama3
```

---

## Updated `POST /translate` Behavior

**Single endpoint handles both fresh + retry requests:**

```
POST /translate (multipart/form-data)
  ├── Has file? → Use uploaded file
  ├── No file + has requestId? → Look up stored file (retry)
  └── No file + no requestId + has text? → Text translation
```

### Curl Examples

**Text translation:**
```bash
curl -X POST http://localhost:4000/translate \
  -F "inputLanguage=English" \
  -F "responseLanguage=Hindi" \
  -F "text=Hello, how are you?"
```

**Image translation:**
```bash
curl -X POST http://localhost:4000/translate \
  -F "inputLanguage=Japanese" \
  -F "responseLanguage=English" \
  -F "image=@./photo.jpg"
```

**Voice translation:**
```bash
curl -X POST http://localhost:4000/translate \
  -F "inputLanguage=Spanish" \
  -F "responseLanguage=English" \
  -F "voice=@./recording.mp3"
```

**Retry (re-process same image/voice from earlier request):**
```bash
curl -X POST http://localhost:4000/translate \
  -F "inputLanguage=Japanese" \
  -F "responseLanguage=English" \
  -F "requestId=550e8400-e29b-41d4-a716-446655440000"
```

---

## Verification Plan

### Automated
- `pnpm run type-check` and `pnpm run build` pass
- Curl commands above work end-to-end

### Manual
- User tests with real OpenAI API key
- User verifies translation quality across input types
