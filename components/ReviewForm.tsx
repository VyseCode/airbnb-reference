"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewForm({
  listingId,
  bookingId,
}: {
  listingId: string;
  bookingId: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/listings/${listingId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating, comment: comment.trim() }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not publish your review");
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        Thanks for sharing your experience. Your review is now live.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
    >
      <h2 className="font-semibold text-slate-900">Review your stay</h2>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600">Rating</span>
        <select
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} {value === 1 ? "star" : "stars"}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        minLength={5}
        maxLength={1500}
        required
        rows={3}
        placeholder="How was your stay?"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#ff385c]"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy || comment.trim().length < 5}
        className="rounded-lg bg-[#ff385c] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Publishing..." : "Publish review"}
      </button>
    </form>
  );
}
