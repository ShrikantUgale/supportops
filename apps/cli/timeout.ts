import "dotenv/config";
import OpenAI from "openai";
import { withRetry } from "./retry";

const client = new OpenAI({ maxRetries: 0 });

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

  // Test C: nothing is listening at this address
  const dead = new OpenAI({
    baseURL: "http://localhost:4010/v1",
    apiKey: "x",
    maxRetries: 0,
  });
  const start = Date.now();
  try {
    await withRetry(() =>
      dead.chat.completions.create({
        model: "anything",
        messages: [{ role: "user", content: "hi" }],
      }),
    );
  } catch (e) {
    console.log(
      "C gave up with:",
      (e as Error).constructor.name,
      "after",
      Date.now() - start,
      "ms",
    );
  }
}

main();
