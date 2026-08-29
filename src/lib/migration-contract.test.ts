import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = ["20260829010000_phase_1_foundation.sql", "20260829061544_phase1_security_hardening.sql"]
  .map((file) => readFileSync(resolve("supabase/migrations", file), "utf8")).join("\n").toLowerCase();
const tables = ["profiles","seller_stats","categories","listings","listing_images","orders","order_status_history","verification_records","deliveries","delivery_location_updates","conversations","messages","seller_reviews","disputes","escrow_records","seller_sale_history"];

describe("database security contract", () => {
  it("forces RLS across every exposed base table", () => {
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("force row level security");
    for (const table of tables) expect(sql).toMatch(new RegExp(`create table public\\.${table}\\b`));
  });
  it("does not grant profile role updates to clients", () => {
    expect(sql).toContain("grant update(display_name,avatar_url) on public.profiles to authenticated");
    expect(sql).not.toContain("grant update(display_name,avatar_url,role)");
  });
  it("uses a security-invoker public history without price fields", () => {
    const view = sql.slice(sql.lastIndexOf("create view public.public_seller_history"));
    expect(view).toContain("security_invoker=true");
    expect(view.split("grant select on public.public_seller_history")[0]).not.toContain("agreed_price");
    expect(view.split("grant select on public.public_seller_history")[0]).not.toContain("current_price");
  });
  it("has participant, sender, review, payment, coordinate, and admin policies", () => {
    for (const policy of ["orders_party_read","messages_participant_read","messages_participant_insert","reviews_buyer_insert","escrow_party_read","locations_party_read","verification_admin_write"]) expect(sql).toContain(`policy ${policy}`);
  });
  it("publishes sale evidence through private trigger functions only", () => {
    expect(sql).toContain("create table public.seller_sale_history");
    expect(sql).toContain("create function private.publish_completed_sale()");
    expect(sql).toContain("revoke all on all functions in schema private from public, anon, authenticated");
    expect(sql).not.toContain("grant insert on public.seller_sale_history to authenticated");
  });
});
