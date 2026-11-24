import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

const getOrderStatus = tool({
  name: "get_order_status",
  description: "Look up the status of a customer's order by its order ID.",
  parameters: z.object({ orderId: z.string() }),
  async execute({ orderId }) {
    if (orderId === "4412")
      return JSON.stringify({
        orderId,
        status: "shipped",
        carrier: "BlueDart",
        daysInTransit: 10,
      });
    return JSON.stringify({ error: "order_not_found" });
  },
});

const agent = new Agent({
  name: "Support agent",
  instructions:
    "You are a customer support assistant. Use tools to look up orders. Be brief and polite.",
  model: process.env.MODEL!,
  tools: [getOrderStatus],
});

async function main() {
  const result = await run(agent, "Where's my order 9999?", { maxTurns: 1 });
  console.log(result.finalOutput);
}
main();
