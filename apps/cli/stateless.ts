import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI();
const model = process.env.MODEL!;

async function ask(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
  const res = await client.chat.completions.create({ model, messages });
  return res.choices[0].message.content;
}

console.log(
  await ask([
    {
      role: "user",
      content: "Hello, My name is Shrikant!",
    },
  ]),
);

console.log(
  await ask([
    {
      role: "user",
      content: "What's my name?",
    },
  ]),
);
