import Fastify from "fastify";
import websocketPlugin from "@fastify/websocket";
import { orderRoutes } from "./routes/orderRoutes";
import { orderWs } from "./websocket/orderWs";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(websocketPlugin);
  await app.register(orderRoutes);
  await app.register(orderWs);

  const port = Number(process.env.PORT || 3000);
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Server listening on ${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
