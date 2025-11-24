import { MarketOrder, OrderStatus } from "../types";
import { MockDexRouter } from "../dex/MockDexRouter";

// ===== "DB" in memory =====
export const orders = new Map<string, MarketOrder>();

// ===== WebSocket listeners =====
type Listener = (status: OrderStatus, payload?: any) => void;
const listeners = new Map<string, Listener[]>();

export function subscribeOrder(
  orderId: string,
  listener: Listener
): () => void {
  const list = listeners.get(orderId) || [];
  list.push(listener);
  listeners.set(orderId, list);

  return () => {
    const arr = listeners.get(orderId) || [];
    listeners.set(
      orderId,
      arr.filter((l) => l !== listener)
    );
  };
}

function emit(orderId: string, status: OrderStatus, payload?: any) {
  const subs = listeners.get(orderId) || [];
  for (const fn of subs) {
    fn(status, payload);
  }
  const order = orders.get(orderId);
  if (order) {
    order.status = status;
    orders.set(orderId, order);
  }
}

// ===== Queue implementation =====
const queue: MarketOrder[] = [];
let active = 0;
const MAX_CONCURRENT = 10;
const MAX_ATTEMPTS = 3;
const router = new MockDexRouter();

export function enqueueOrder(order: MarketOrder) {
  console.log("QUEUE: order received to enqueue:", order.id);
  queue.push(order);
  orders.set(order.id, order);
  processQueue();
}

function processQueue() {
  console.log("QUEUE: processQueue called. Active:", active, "Queue length:", queue.length);
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const order = queue.shift()!;
    console.log("QUEUE: processing order", order.id);
    active++;
    processOrder(order)
      .catch(() => {
        // errors handled inside processOrder
      })
      .finally(() => {
        active--;
        processQueue();
      });
  }
}

async function processOrder(order: MarketOrder): Promise<void> {
  const orderId = order.id;

  try {
    emit(orderId, "pending");

    emit(orderId, "routing");
    const best = await router.pickBestDex(
      order.tokenIn,
      order.tokenOut,
      order.amount
    );

    emit(orderId, "building", { dex: best.dex, price: best.price });

    emit(orderId, "submitted");

    const result = await router.executeSwap(best.dex, best.price);

    emit(orderId, "confirmed", {
      dex: best.dex,
      txHash: result.txHash,
      executedPrice: result.executedPrice
    });
  } catch (err) {
    console.error("Order failed", orderId, err);
    if (order.attempts < MAX_ATTEMPTS) {
      const nextAttempt = order.attempts + 1;
      const delay = 1000 * Math.pow(2, order.attempts); // 1s, 2s, 4s...

      const retry: MarketOrder = {
        ...order,
        attempts: nextAttempt
      };

      setTimeout(() => {
        queue.push(retry);
        processQueue();
      }, delay);
    } else {
      emit(orderId, "failed", {
        error: "Max retry attempts reached"
      });
    }
  }
}
