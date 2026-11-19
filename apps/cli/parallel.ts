import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({ maxRetries: 0 });
const call = () =>
  client.chat.completions.create({
    model: process.env.MODEL!,
    messages: [{ role: "user", content: "Reply with: ok" }],
    max_completion_tokens: 500,
  });

async function burst(n: number) {
  const s = Date.now();
  const results = await Promise.allSettled(
    Array.from({ length: n }, () => call()),
  );

  const tally: Record<string, number> = {};
  for (const r of results) {
    const key =
      r.status === "fulfilled"
        ? "ok"
        : String((r.reason as { status?: number }).status ?? "no status");
    tally[key] = (tally[key] ?? 0) + 1;
  }
  console.log(`burst x${n}:`, tally, Date.now() - s, "ms");
}

async function main() {
  await burst(300);
  // let s = Date.now();
  // for (let i = 0; i < 5; i++) await call();
  // console.log("sequential x5:", Date.now() - s, "ms");
  // s = Date.now();
  // await Promise.all(Array.from({ length: 5 }, () => call()));
  // console.log("parallel x5:", Date.now() - s, "ms");
}
main();
