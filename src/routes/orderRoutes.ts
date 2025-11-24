import { FastifyInstance } from "fastify";
import { z } from "zod";
import { createMarketOrder } from "../services/orderService";

const orderSchema = z.object({
  tokenIn: z.string(),
  tokenOut: z.string(),
  amount: z.number().positive()
});

export async function orderRoutes(app: FastifyInstance) {
  app.post("/api/orders/execute", async (request, reply) => {
    const parsed = orderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const { tokenIn, tokenOut, amount } = parsed.data;

    const { id } = await createMarketOrder({ tokenIn, tokenOut, amount });
    return reply.send({ orderId: id });
  });
}
