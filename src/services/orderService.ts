import { MarketOrder } from "../types";
import { enqueueOrder } from "../queue/orderQueue";

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function createMarketOrder(input: {
  tokenIn: string;
  tokenOut: string;
  amount: number;
}): Promise<{ id: string }> {
  const id = generateId();

  const order: MarketOrder = {
    id,
    type: "market",
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    amount: input.amount,
    status: "pending",
    createdAt: Date.now(),
    attempts: 0
  };

  enqueueOrder(order);

  return { id };
}
