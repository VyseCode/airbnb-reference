"use client";

import { useState } from "react";

export function WishlistButton({
  listingId,
  initial,
  signedIn,
}: {
  listingId: string;
  initial: boolean;
  signedIn: boolean;
}) {
  const [wishlisted, setWishlisted] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!signedIn || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = (await response.json()) as {
        wishlisted?: boolean;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Could not update your wishlist");
        return;
      }
      setWishlisted(Boolean(data.wishlisted));
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!signedIn || busy}
      title={signedIn ? (wishlisted ? "Remove from wishlist" : "Save to wishlist") : "Sign in to save"}
      aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
        wishlisted
          ? "border-[#ff385c] text-[#ff385c]"
          : "border-slate-200 text-slate-500 hover:text-[#ff385c]"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
      {error && <span className="sr-only">{error}</span>}
    </button>
  );
}
