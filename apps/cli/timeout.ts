import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({ timeout: 1, maxRetries: 0 });

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
    }
  }
  console.log("gave up");
}
main();
