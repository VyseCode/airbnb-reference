"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type BlockedDatesManagerProps = {
  listingId: string;
  initialDates: string[];
};

export function BlockedDatesManager({
  listingId,
  initialDates,
}: BlockedDatesManagerProps) {
  const router = useRouter();
  const [dates, setDates] = useState(initialDates);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!date) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/listings/${listingId}/blocked-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not block that date");
        return;
      }
      setDates((current) => [...current, date].sort());
      setDate("");
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(value: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/listings/${listingId}/blocked-dates/${value}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not unblock that date");
        return;
      }
      setDates((current) => current.filter((item) => item !== value));
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold text-slate-900">Blocked dates</h2>
      <p className="mt-1 text-sm text-slate-500">
        Guests cannot book nights on these dates.
      </p>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !date}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Block
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {dates.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {dates.map((value) => (
            <li
              key={value}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
            >
              {value}
              <button
                type="button"
                onClick={() => remove(value)}
                disabled={busy}
                className="text-slate-500 hover:text-[#ff385c]"
                aria-label={`Unblock ${value}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
