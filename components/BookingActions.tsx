"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BookingStatus } from "@/lib/types";

type BookingActionsProps = {
  bookingId: string;
  listingId: string;
  role: "guest" | "host";
  status: BookingStatus;
  reviewId: string | null;
  reviewDeadline: string | null;
  reviewWindowOpen: boolean;
};

export function BookingActions({
  bookingId,
  listingId,
  role,
  status,
  reviewId,
  reviewDeadline,
  reviewWindowOpen,
}: BookingActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function act(action: "confirm" | "cancel" | "complete") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not update this booking");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {role === "host" && status === "pending" && (
        <button
          type="button"
          onClick={() => act("confirm")}
          disabled={busy}
          className="rounded-lg bg-[#ff385c] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Confirm
        </button>
      )}
      {(status === "pending" || status === "confirmed") && (
        <button
          type="button"
          onClick={() => act("cancel")}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-50"
        >
          Cancel
        </button>
      )}
      {status === "confirmed" && (
        <button
          type="button"
          onClick={() => act("complete")}
          disabled={busy}
          title="Available once the stay has ended"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 disabled:opacity-50"
        >
          Mark complete
        </button>
      )}
      {status === "completed" &&
        (reviewId ? (
          <Link
            href={`/listings/${listingId}`}
            className="text-xs font-semibold text-emerald-700"
          >
            Reviewed
          </Link>
        ) : reviewWindowOpen ? (
          <Link
            href={`/listings/${listingId}?review=${bookingId}`}
            className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Write review
          </Link>
        ) : (
          <span className="text-xs text-slate-500">Review window closed</span>
        ))}
      {status === "completed" && !reviewId && reviewDeadline && (
        <span className="text-xs text-slate-500">
          Closes {reviewDeadline.slice(0, 10)}
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
