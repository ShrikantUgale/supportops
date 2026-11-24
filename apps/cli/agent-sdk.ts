import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

const getOrderStatus = tool({
  name: "get_order_status",
  description: "Look up the status of a customer's order by its order ID.",
  parameters: z.object({ orderId: z.string() }),
  async execute({ orderId }) {
    try {
      if (orderId === "5000") throw new Error("database connection lost");
      if (orderId === "4412")
        return JSON.stringify({
          orderId,
          status: "shipped",
          carrier: "BlueDart",
          daysInTransit: 10,
        });
      return JSON.stringify({ error: "order_not_found" });
    } catch (e) {
      console.error("tool failed", this.name, (e as Error).message);
      return JSON.stringify({
        error: "temporarily_unavailable",
        retryable: false,
      });
    }
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
  try {
    const result = await run(agent, "Where's my order 4412?", { maxTurns: 5 });
    console.log("answer:", result.finalOutput);
    for (const item of result.newItems) {
      console.log(
        item.type,
        item.type === "tool_call_output_item" ? (item as any).output : "",
      );
    }
  } catch (e) {
    console.log(
      "caught:",
      (e as Error).constructor.name,
      "-",
      (e as Error).message,
    );
  }
}
main();
