import { FastifyInstance } from "fastify";
import { subscribeOrder } from "../queue/orderQueue";

export async function orderWs(app: FastifyInstance) {
  app.get(
    "/api/orders/execute",
    { websocket: true },
    // NOTE: here `connection` is the raw WebSocket
    (connection: any, req) => {
      let orderId: string | null = null;

      try {
        const url = new URL(req.url, "http://localhost");
        orderId = url.searchParams.get("orderId");
      } catch (e) {
        app.log.error(e, "Failed to parse WebSocket URL");
      }

      app.log.info({ orderId }, "WS connection started");

      if (!orderId) {
        try {
          connection.send(
            JSON.stringify({ type: "error", message: "orderId is required" })
          );
        } catch (e) {
          app.log.error(e, "Failed to send error message");
        }
        try {
          connection.close();
        } catch (e) {
          app.log.error(e, "Failed to close socket");
        }
        return;
      }

      // ---- Initial test message so you SEE something immediately ----
      try {
        const hello = {
          orderId,
          status: "connected",
          msg: "hello-from-server"
        };
        app.log.info(hello, "Sending initial WS message");
        connection.send(JSON.stringify(hello));
      } catch (e) {
        app.log.error(e, "Failed to send initial WS message");
      }

      // ---- Subscribe to order status updates ----
      const unsubscribe = subscribeOrder(orderId, (status, payload) => {
        const message = { orderId, status, ...payload };
        app.log.info(message, "WS status update (about to send)");
        try {
          connection.send(JSON.stringify(message));
        } catch (e) {
          app.log.error(e, "Failed to send WS status update");
        }
      });

      // Clean up when client disconnects
      if (typeof connection.on === "function") {
        connection.on("close", () => {
          app.log.info({ orderId }, "WS connection closed");
          unsubscribe();
        });
      }
    }
  );
}
