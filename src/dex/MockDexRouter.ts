import { sleep } from "../utils/sleep";

export interface DexQuote {
  dex: "raydium" | "meteora";
  price: number;
  fee: number;
}

export interface ExecuteResult {
  txHash: string;
  executedPrice: number;
}

const basePrice = 10; // fake base price

function randomTxHash() {
  return "0x" + Math.random().toString(16).slice(2).padEnd(32, "0");
}

export class MockDexRouter {
  async getRaydiumQuote(
    tokenIn: string,
    tokenOut: string,
    amount: number
  ): Promise<DexQuote> {
    await sleep(200); // simulate latency
    return {
      dex: "raydium",
      price: basePrice * (0.98 + Math.random() * 0.04),
      fee: 0.003
    };
  }

  async getMeteoraQuote(
    tokenIn: string,
    tokenOut: string,
    amount: number
  ): Promise<DexQuote> {
    await sleep(200);
    return {
      dex: "meteora",
      price: basePrice * (0.97 + Math.random() * 0.05),
      fee: 0.002
    };
  }

  async pickBestDex(
    tokenIn: string,
    tokenOut: string,
    amount: number
  ): Promise<DexQuote> {
    const [r, m] = await Promise.all([
      this.getRaydiumQuote(tokenIn, tokenOut, amount),
      this.getMeteoraQuote(tokenIn, tokenOut, amount)
    ]);

    // For simplicity, choose lower price as "better"
    return r.price <= m.price ? r : m;
  }

  async executeSwap(dex: string, price: number): Promise<ExecuteResult> {
    // 2–3 seconds simulated execution
    await sleep(2000 + Math.random() * 1000);
    const slipside = 1 + (Math.random() * 0.02 - 0.01); // ±1% slippage
    return {
      txHash: randomTxHash(),
      executedPrice: price * slipside
    };
  }
}
