import { describe, expect, it } from "vitest";
import { calculateTrustScore, canTransition, dashboardForRole, isRolePathAllowed } from "./domain";

describe("transaction state machine", () => {
  it("allows successful and failed inspection branches", () => {
    expect(canTransition("inspection_in_progress", "verified")).toBe(true);
    expect(canTransition("inspection_in_progress", "verification_failed")).toBe(true);
    expect(canTransition("payment_pending", "completed")).toBe(false);
  });
});

describe("role routing", () => {
  it("keeps roles in their own protected area", () => {
    expect(dashboardForRole("seller")).toBe("/seller");
    expect(isRolePathAllowed("buyer", "/buyer/purchases")).toBe(true);
    expect(isRolePathAllowed("buyer", "/admin")).toBe(false);
  });
});

describe("seller trust", () => {
  it("is deterministic, bounded, and penalizes disputes", () => {
    expect(calculateTrustScore(10, 4.5, 0)).toBe(78);
    expect(calculateTrustScore(10, 4.5, 2)).toBe(68);
    expect(calculateTrustScore(1000, 9, 0)).toBe(100);
  });
});
