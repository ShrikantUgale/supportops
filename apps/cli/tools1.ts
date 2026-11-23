import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI();

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_order_status",
      description: "Look up the status of a customer's order by its order ID.",
      parameters: {
        type: "object",
        properties: {
          orderId: { type: "string", description: "The order ID, e.g. 4412" },
        },
        required: ["orderId"],
        additionalProperties: false,
      },
    },
  },
];

async function main() {
  const res = await client.chat.completions.create({
    model: process.env.MODEL!,
    messages: [{ role: "user", content: "What's the weather in Pune?" }],
    tools,
    max_completion_tokens: 1000,
    reasoning_effort: "none",
  });
  const choice = res.choices[0];
  console.log("finish_reason:", choice.finish_reason);
  console.log("content:", choice.message.content);
  console.log(
    "tool_calls:",
    JSON.stringify(choice.message.tool_calls, null, 2),
  );
}
main();
