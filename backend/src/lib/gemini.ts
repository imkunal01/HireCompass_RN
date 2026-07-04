import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
const MODEL = "llama-3.3-70b-versatile";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getClient() {
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error(
      "GROQ_API_KEY is not configured. Get your free key at https://console.groq.com/keys and add it to .env"
    );
  }
  return new Groq({ apiKey });
}

function parseRetryDelay(err: unknown): number | null {
  const msg = err instanceof Error ? err.message : String(err);
  const match = msg.match(/try again in (\d+(?:\.\d+)?)s/i);
  return match ? Math.ceil(parseFloat(match[1])) : null;
}

function isRetryableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("502") ||
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("rate_limit") ||
    msg.toLowerCase().includes("too many requests") ||
    msg.toLowerCase().includes("service unavailable") ||
    msg.toLowerCase().includes("try again")
  );
}

export async function extractJSON<T = unknown>(prompt: string): Promise<T> {
  const client = getClient();
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "You are a precise data extractor. Always respond with valid JSON only. No markdown, no backticks, no explanation.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: "json_object" },
      });

      const raw = completion.choices[0]?.message?.content?.trim() ?? "";
      return JSON.parse(raw) as T;
    } catch (err) {
      lastError = err;
      if (isRetryableError(err) && attempt < MAX_RETRIES) {
        const retryDelay = parseRetryDelay(err);
        const waitMs = retryDelay ? retryDelay * 1000 : RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[Groq] Rate limited. Retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }

  const delay = parseRetryDelay(lastError);
  const hint = delay
    ? ` Please wait ${delay}s and try again.`
    : " Free tier limit reached. Try again in a minute.";
  throw new Error(`Groq unavailable after ${MAX_RETRIES} retries.${hint}`);
}

export function streamText(prompt: string): NodeJS.ReadableStream {
  const { Readable } = require("stream");
  const readable = new Readable({
    read() {},
  });

  (async () => {
    let attempt = 0;
    let succeeded = false;

    while (attempt <= MAX_RETRIES) {
      try {
        const client = getClient();
        const stream = await client.chat.completions.create({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: "You are an expert AI assistant helping with job applications. Be concise and professional.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          stream: true,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) readable.push(text);
        }

        succeeded = true;
        break;
      } catch (err) {
        if (isRetryableError(err) && attempt < MAX_RETRIES) {
          const retryDelay = parseRetryDelay(err);
          const waitMs = retryDelay ? retryDelay * 1000 : RETRY_DELAY_MS * Math.pow(2, attempt);
          console.warn(`[Groq] Stream rate limited. Retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          attempt++;
          await sleep(waitMs);
          continue;
        }
        const msg = err instanceof Error ? err.message : "Groq API error";
        readable.push(`__ERROR__:${msg}`);
        succeeded = true;
        break;
      }
    }

    if (!succeeded) {
      readable.push(
        `__ERROR__:Groq rate limit reached. Free tier allows 30 req/min & 14,400 req/day. Please wait a moment and try again.`
      );
    }
    readable.push(null); // End stream
  })();

  return readable;
}

export function isGeminiConfigured(): boolean {
  return Boolean(apiKey && apiKey !== "your_groq_api_key_here");
}

export function getModel() {
  return MODEL;
}

export function formatGeminiError(err: unknown): { message: string; retryAfter: number | null } {
  const raw = err instanceof Error ? err.message : String(err);
  const retryAfter = parseRetryDelay(err);

  if (isRetryableError(err)) {
    return {
      message: retryAfter
        ? `Groq rate limit hit. Please wait ${retryAfter} seconds and try again.`
        : "Groq rate limit reached. Please wait a moment before trying again.",
      retryAfter,
    };
  }

  return { message: raw, retryAfter: null };
}
