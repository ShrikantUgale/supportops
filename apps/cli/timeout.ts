import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({ timeout: 1, maxRetries: 0 }); // wait at most 1 millisecond, try with and without retry

async function main() {
  const start = Date.now();
  try {
    await client.chat.completions.create({
      model: process.env.MODEL!,
      messages: [{ role: "user", content: "hi" }],
    });
  } catch (e) {
    console.log((e as Error).constructor.name, "-", (e as Error).message);
  }
  console.log("took", Date.now() - start, "ms");
}
main();
