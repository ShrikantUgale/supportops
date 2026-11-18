import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI();
const model = process.env.MODEL!;
const globalMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

async function ask(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
  const res = await client.chat.completions.create({ model, messages });
  globalMessages.push({
    role: "assistant",
    content: res.choices[0].message.content,
  });
  console.log(
    `Prompt Tokens: ${res.usage?.prompt_tokens}, Completion Tokens: ${res.usage?.completion_tokens}, Total Tokens: ${res.usage?.total_tokens}`,
  );
  return res.choices[0].message.content;
}

globalMessages.push({
  role: "user",
  content: "Hello, My name is Shrikant!",
});
console.log(await ask(globalMessages));
globalMessages.push({
  role: "user",
  content: "What's my name?",
});
console.log(await ask(globalMessages));
