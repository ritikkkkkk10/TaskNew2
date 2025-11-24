import { MarketOrder, OrderStatus } from "../types";
import { MockDexRouter } from "../dex/MockDexRouter";

// -------- In-memory store --------
export const orders = new Map<string, MarketOrder>();

// All events per order for replay
type Event = { status: OrderStatus; payload?: any };
const events = new Map<string, Event[]>();

// WebSocket listeners (live)
type Listener = (status: OrderStatus, payload?: any) => void;
const listeners = new Map<string, Listener[]>();

// Subscribe + immediate replay of previous events
export function subscribeOrder(
  orderId: string,
  listener: Listener
): () => void {
  // 1) replay history
  const history = events.get(orderId) || [];
  for (const ev of history) {
    listener(ev.status, ev.payload);
  }

  // 2) subscribe for future
  const list = listeners.get(orderId) || [];
  list.push(listener);
  listeners.set(orderId, list);

  // unsubscriber
  return () => {
    const arr = listeners.get(orderId) || [];
    listeners.set(
      orderId,
      arr.filter((l) => l !== listener)
    );
  };
}

function recordEvent(orderId: string, status: OrderStatus, payload?: any) {
  const list = events.get(orderId) || [];
  list.push({ status, payload });
  events.set(orderId, list);
}

function emit(orderId: string, status: OrderStatus, payload?: any) {
  recordEvent(orderId, status, payload);

  // update order object
  const order = orders.get(orderId);
  if (order) {
    order.status = status;
    orders.set(orderId, order);
  }

  // notify live listeners
  const subs = listeners.get(orderId) || [];
  for (const fn of subs) {
    fn(status, payload);
  }
}

// -------- Simple in-memory queue --------
const queue: MarketOrder[] = [];
let active = 0;
const MAX_CONCURRENT = 10;
const MAX_ATTEMPTS = 3;
const router = new MockDexRouter();

export function enqueueOrder(order: MarketOrder) {
  console.log("QUEUE: enqueue", order.id);
  queue.push(order);
  orders.set(order.id, order);
  processQueue();
}

function processQueue() {
  console.log("QUEUE: processQueue, active =", active, "len =", queue.length);
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const order = queue.shift()!;
    active++;
    console.log("QUEUE: start order", order.id);
    processOrder(order)
      .catch((err) => console.error("QUEUE: order error", err))
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
      const delay = 1000 * Math.pow(2, order.attempts); // 1s, 2s, 4s

      const retry: MarketOrder = {
        ...order,
        attempts: nextAttempt
      };

      setTimeout(() => {
        queue.push(retry);
        processQueue();
      }, delay);
    } else {
      emit(orderId, "failed", { error: "Max retry attempts reached" });
    }
  }
}
