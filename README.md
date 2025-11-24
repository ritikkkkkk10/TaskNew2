##### Summary of how to run ####

---

# 🌍 **1. Normal API URL (Create Order)**

Use this to **create an order**:

```
POST https://tasknew2-backend.onrender.com/api/orders/execute
```

Body example:

```json
{
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amount": 1.5
}
```

Response gives you an:

```
orderId
```

---

# 🔌 **2. WebSocket URL (Live Updates)**

After you get `orderId`, put it here:

```
wss://tasknew2-backend.onrender.com/api/orders/execute?orderId=<orderId>
```

Example:

```
wss://tasknew2-backend.onrender.com/api/orders/execute?orderId=abcd123
```

You will receive live messages:

```
connected
pending
routing
building
submitted
confirmed
```

---

### ✔ Simple Rule:

* **POST URL** → to *create* an order
* **WS URL** → to *watch* the order

Use the POST output → plug the `orderId` into the WS URL.

#### -------------------------------------------------------------------------- ####

# 🚀 Order Execution Engine (Simple Version)

This project is a **Market Order Execution Engine**.
A user creates an order using **HTTP**, and receives live updates using **WebSocket**.

Everything is **mocked** (fake DEX prices, fake transaction), so it’s easy and fast.

---

# ✅ How It Works (In Very Simple Words)

1. **User sends an order**
   → Using `POST /api/orders/execute`

2. **Server creates the order**
   → Gives back:

   * `orderId`

3. **User connects to WebSocket**
   → Using the `wsUrl`

4. **Server sends live updates**
   → `pending → routing → building → submitted → confirmed`

5. **Mock DEX router** chooses the best price between:

   * Raydium
   * Meteora
     (fake/random values)

6. **Order finishes** with:

   * `executedPrice`
   * `txHash`

---

# 🔌 API Endpoint

### 👉 Create an order
POST order here

https://tasknew2-backend.onrender.com/api/orders/execute


```
POST /api/orders/execute
```

### Example Body

```json
{
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amount": 1.5
}
```

### Example Response

```json
{
  "orderId": "abcd123"
}
```
`wsUrl`= wss://tasknew2-backend.onrender.com/api/orders/execute?orderId=<id>

use orderid given in <id>
You simply use `wsUrl` to connect your WebSocket.

---

# 🔊 WebSocket

Connect to:

```
wss://tasknew2-backend.onrender.com/api/orders/execute?orderId=<id>
```

You will receive messages like:

```
connected
pending
routing
building
submitted
confirmed
```

Each message looks like:

```json
{
  "orderId": "abcd123",
  "status": "routing"
}
```

---

# 🎯 DEX Routing (Simple Explanation)

* Raydium gives a random price
* Meteora gives a random price
* The better one is selected
* A fake transaction is created with:

  * `txHash`
  * `executedPrice`

No real blockchain, only simulation.

---

# 🔁 Order Queue (Simple)

* Up to **10 orders run at the same time**
* If one fails, it retries **3 times**
* Delay increases: 1s → 2s → 4s

---

# 🌍 Deployment

Live backend:

```
https://tasknew2-backend.onrender.com
```

Use this base URL for:

* API (POST)
* WebSocket (wss)

---

# 📁 Project Structure

```
src/
  index.ts
  routes/
  websocket/
  dex/
  queue/
  utils/
```

---

# 🧪 Tests & Postman

Includes:

* Basic test cases
* Postman collection for API testing

---

# 🎥 Demo Video (What to Show)

1. Send 3–5 orders in Postman
2. Connect to WebSockets
3. Show live updates
4. Show routing (Raydium vs Meteora)
5. Show successful execution

---

# ✔ Summary

This project shows:

* Market order processing
* Mock DEX price comparison
* WebSocket live updates
* Multiple order handling
* Retry logic
* Clean and simple architecture

---
