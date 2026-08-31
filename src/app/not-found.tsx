import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-page px-4 text-center">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-action">404</p>
        <h1 className="mt-3 text-[28px] font-extrabold tracking-tight text-ink">Page not found</h1>
        <p className="mt-2 text-[14px] text-ink-secondary">This listing may have sold or the link has changed.</p>
        <Button href="/buyer/marketplace" className="mt-6">
          Back to marketplace
        </Button>
      </div>
    </div>
  );
}
