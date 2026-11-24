import "dotenv/config";
import OpenAI from "openai";
import { z } from "zod";

const client = new OpenAI();

const model = process.env.MODEL!;
const ArgsSchema = z.object({ orderId: z.string() });

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

function toToolError(e: unknown) {
  if (e instanceof z.ZodError) {
    // The model produced these arguments, so detail helps it fix them
    return {
      error: "invalid_arguments",
      detail: e.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    };
  }
  if (e instanceof SyntaxError) {
    return {
      error: "invalid_arguments",
      detail: "arguments were not valid JSON",
    };
  }
  // Infrastructure errors and bugs: generic text only, never the raw message
  return { error: "temporarily_unavailable" };
}

function getOrderStatus(orderId: string) {
  if (orderId === "4412")
    return {
      orderId,
      status: "shipped",
      carrier: "BlueDart",
      daysInTransit: 10,
    };
  if (orderId === "5000") throw new Error("database connection lost");
  return { error: "order_not_found" };
}

async function runAgent(
  userMessage: string,
  maxTurns = 5,
): Promise<string | null> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "user", content: userMessage },
  ];

  for (let turn = 1; turn <= maxTurns; turn++) {
    console.log(`turn ${turn}`);
    const res = await client.chat.completions.create({
      model,
      messages,
      tools,
      max_completion_tokens: 1000,
      reasoning_effort: "none",
    });

    const msg = res.choices[0].message;

    if (!msg.tool_calls) {
      return msg.content;
    }

    messages.push(msg);

    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;
      try {
        const args = ArgsSchema.parse(JSON.parse(call.function.arguments));
        const result = getOrderStatus(args.orderId);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      } catch (error) {
        console.error("tool failed", call.id, error); // full detail, for us
        const content = JSON.stringify(toToolError(error)); // safe summary, for the model
        console.log("sent to model:", content);
        messages.push({ role: "tool", tool_call_id: call.id, content });
      }
    }
  }

  throw new Error("Agent exceeded max turns");
}

async function main() {
  try {
    console.log(await runAgent("Where's my order 5000?"));
    console.log(await runAgent("Where's my order 9999?"));
    console.log(await runAgent("Where's my order 4412?"));
  } catch (error) {
    console.error("Error:", error);
  }
}
main();
