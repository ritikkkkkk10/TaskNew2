export type OrderStatus =
  | "pending"
  | "routing"
  | "building"
  | "submitted"
  | "confirmed"
  | "failed";

export interface MarketOrder {
  id: string;
  type: "market";
  tokenIn: string;
  tokenOut: string;
  amount: number;
  status: OrderStatus;
  createdAt: number;
  attempts: number;
}
