import "dotenv/config";
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import { withRetry } from "./retry";

class TransientDbError extends Error {}

const FAIL_FIRST = 3; // experiment A: 2. Experiment B: 99
let dbCalls = 0;

async function fakeDb(orderId: string) {
  dbCalls++;
  if (orderId === "5000" && dbCalls <= FAIL_FIRST) {
    console.error(`db attempt ${dbCalls} failed`);
    throw new TransientDbError("database connection lost");
  }
  if (orderId === "5000" || orderId === "4412")
    return {
      orderId,
      status: "shipped",
      carrier: "BlueDart",
      daysInTransit: 10,
    };
  return null; // not found
}

const getRefundPolicy = tool({
  name: "get_refund_policy",
  description:
    "Get the store's refund policy: how many days customers have to request a refund and what is excluded.",
  parameters: z.object({}),
  async execute() {
    return "Refunds are available within 30 days of delivery. Digital items and gift cards are not refundable.";
  },
});

const getOrderStatus = tool({
  name: "get_order_status",
  description: "Look up the status of a customer's order by its order ID.",
  parameters: z.object({ orderId: z.string() }),
  async execute({ orderId }) {
    try {
      const order = await withRetry(
        () => fakeDb(orderId),
        3,
        (e) => e instanceof TransientDbError,
      );
      return JSON.stringify(order ?? { error: "order_not_found" });
    } catch (e) {
      console.error("tool failed: get_order_status", e);
      return JSON.stringify({
        error: "temporarily_unavailable",
        retryable: false,
      }); // we already retried
    }
  },
});

const agent = new Agent({
  name: "Support agent",
  instructions:
    "You are a customer support assistant. Use tools to look up orders. Be brief and polite.",
  model: process.env.MODEL!,
  tools: [getOrderStatus, getRefundPolicy],
});

async function ask(q: string) {
  const result = await run(agent, q, { maxTurns: 5 });
  const called = result.newItems
    .filter((i) => i.type === "tool_call_item")
    .map((i) => (i as any).rawItem?.name);
  console.log(
    `\nQ: ${q}\ntools called: ${JSON.stringify(called)}\nA: ${result.finalOutput}`,
  );
}

async function main() {
  try {
    await ask("Where's my order 4412?");
    await ask("What's your refund policy?");
    await ask("Where's my order 4412, and can I still get a refund for it?");
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
