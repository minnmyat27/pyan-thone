export const roles = ["buyer", "seller", "admin"] as const;
export type Role = (typeof roles)[number];

export const orderStatuses = [
  "payment_pending", "payment_secured", "awaiting_seller_shipment",
  "shipping_to_verification", "received_at_verification", "inspection_in_progress",
  "verified", "verification_failed", "buyer_refund_pending", "buyer_refunded",
  "return_to_seller", "out_for_delivery", "delivered", "payment_released",
  "completed", "closed",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const allowedTransitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  payment_pending: ["payment_secured"], payment_secured: ["awaiting_seller_shipment"],
  awaiting_seller_shipment: ["shipping_to_verification"], shipping_to_verification: ["received_at_verification"],
  received_at_verification: ["inspection_in_progress"], inspection_in_progress: ["verified", "verification_failed"],
  verified: ["out_for_delivery"], verification_failed: ["buyer_refund_pending"],
  buyer_refund_pending: ["buyer_refunded"], buyer_refunded: ["return_to_seller"],
  return_to_seller: ["closed"], out_for_delivery: ["delivered"], delivered: ["payment_released"],
  payment_released: ["completed"], completed: [], closed: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return allowedTransitions[from].includes(to);
}

export function calculateTrustScore(completedSales: number, averageRating: number, disputeCount: number) {
  const volume = Math.min(completedSales, 20) * 1.5;
  const rating = Math.max(0, Math.min(averageRating, 5)) * 14;
  const disputes = Math.min(disputeCount, 10) * 5;
  return Math.round(Math.max(0, Math.min(100, volume + rating - disputes)));
}

export function dashboardForRole(role: Role) { return `/${role}`; }
export function isRolePathAllowed(role: Role, pathname: string) { return pathname === `/${role}` || pathname.startsWith(`/${role}/`); }

export const itemConditions = ["new", "like_new", "good", "fair", "poor"] as const;
export type ItemCondition = (typeof itemConditions)[number];

export function validateListing(input: {
  title: string; description: string; categoryId: string; condition: string; price: number;
}) {
  const errors: string[] = [];
  if (input.title.trim().length < 3 || input.title.trim().length > 140) errors.push("Title must be 3–140 characters.");
  if (input.description.trim().length < 10) errors.push("Description must be at least 10 characters.");
  if (!input.categoryId) errors.push("Choose a category.");
  if (!itemConditions.includes(input.condition as ItemCondition)) errors.push("Choose a valid condition.");
  if (!Number.isFinite(input.price) || input.price <= 0 || input.price > 999_999_999_999) errors.push("Enter a valid positive price.");
  return errors;
}

export const successfulProgress: readonly OrderStatus[] = [
  "payment_secured","awaiting_seller_shipment","shipping_to_verification","received_at_verification",
  "inspection_in_progress","verified","out_for_delivery","delivered","payment_released","completed",
];
export const failedProgress: readonly OrderStatus[] = [
  "verification_failed","buyer_refund_pending","buyer_refunded","return_to_seller","closed",
];

export function formatStatus(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
