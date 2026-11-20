import OpenAI from "openai";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isRetryable(e) || attempt >= maxAttempts) {
        throw e;
      }

      const ceiling = 500 * 2 ** (attempt - 1);
      const delay = Math.round(Math.random() * ceiling);
      await sleep(delay);
    }
  }
}

function isRetryable(e: unknown): boolean {
  if (e instanceof OpenAI.APIConnectionError) return true;
  if (e instanceof OpenAI.APIError) {
    if (e.status === 429 || e.status === 408) return true;
    if (e.status && e.status >= 500) return true;
  }
  return false;
}
