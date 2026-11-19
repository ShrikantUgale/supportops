import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({ maxRetries: 0 });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (!isRetryable(e) || attempt >= maxAttempts) {
        throw e;
      }

      const ceiling = 500 * 2 ** (attempt - 1);
      const delay = Math.round(Math.random() * ceiling);
      console.log(`  waiting ${delay}ms`); // NEW
      await sleep(delay); // NEW
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

async function main() {
  // Test A: works normally
  const ok = new OpenAI({ maxRetries: 0 });
  const res = await withRetry(() =>
    ok.chat.completions.create({
      model: process.env.MODEL!,
      messages: [{ role: "user", content: "Reply with: ok" }],
      max_completion_tokens: 500,
    }),
  );
  console.log("A:", res.choices[0].message.content);

  // Test B: always times out, caller handles the final failure
  const slow = new OpenAI({ timeout: 1, maxRetries: 0 });
  try {
    await withRetry(
      () =>
        slow.chat.completions.create({
          model: process.env.MODEL!,
          messages: [{ role: "user", content: "hi" }],
        }),
      5,
    );
  } catch (e) {
    console.log("B gave up with:", (e as Error).constructor.name);
  }
}

main();
