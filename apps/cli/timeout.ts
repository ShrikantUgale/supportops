import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({ timeout: 1, maxRetries: 0 });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms)); // NEW

async function main() {
  const start = Date.now();
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await client.chat.completions.create({
        model: process.env.MODEL!,
        messages: [{ role: "user", content: "hi" }],
      });
      console.log("success");
      return;
    } catch (e) {
      console.log(
        `attempt ${attempt} failed at ${Date.now() - start}ms:`,
        (e as Error).constructor.name,
      );
      if (attempt < 3) {
        // NEW
        const delay = 500 * 2 ** (attempt - 1); // NEW: 500, then 1000
        console.log(`  waiting ${delay}ms`); // NEW
        await sleep(delay); // NEW
      }
    }
  }
  console.log("gave up");
}
main();
