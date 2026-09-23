import type { Dictionary } from "@/i18n/dictionaries";
import type { OrderStatus, PaymentStatus } from "@/lib/api/types";

export function orderStatusLabel(status: OrderStatus, labels: Dictionary["track"]): string {
  const map: Record<OrderStatus, keyof Dictionary["track"]> = {
    Pending: "statusPending",
    Confirmed: "statusConfirmed",
    Shipped: "statusShipped",
    Delivered: "statusDelivered",
    Cancelled: "statusCancelled",
  };
  return labels[map[status]];
}

export function paymentStatusLabel(status: PaymentStatus, labels: Dictionary["track"]): string {
  return status === "Paid" ? labels.paymentPaid : labels.paymentUnpaid;
}

/** Guest tracking tokens are exactly 22 base64url characters. */
export function isValidTrackingToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{22}$/.test(token);
}
