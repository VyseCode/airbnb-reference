"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bookingTotals } from "@/lib/dates";

type BookingWidgetProps = {
  listingId: string;
  pricePerNight: number;
  capacity: number;
  isHost: boolean;
  signedIn: boolean;
};

type Availability = {
  dates: string[];
  ranges: Array<{ checkIn: string; checkOut: string }>;
};

export function BookingWidget({
  listingId,
  pricePerNight,
  capacity,
  isHost,
  signedIn,
}: BookingWidgetProps) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [availability, setAvailability] = useState<Availability>({
    dates: [],
    ranges: [],
  });
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/listings/${listingId}/availability`)
      .then((response) => response.json())
      .then((data: Availability) => {
        if (active) setAvailability(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [listingId]);

  const nights =
    checkIn && checkOut
      ? Math.round(
          (new Date(`${checkOut}T00:00:00Z`).getTime() -
            new Date(`${checkIn}T00:00:00Z`).getTime()) /
            86_400_000,
        )
      : 0;
  const totals = nights > 0 ? bookingTotals(pricePerNight, nights) : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBookingId("");
    setBusy(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guests: Number(guests),
        }),
      });
      const data = (await response.json()) as {
        booking?: { id: string };
        error?: string;
      };
      if (!response.ok || !data.booking) {
        setError(data.error ?? "Could not create your booking");
        return;
      }
      setBookingId(data.booking.id);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          <Link href="/login" className="font-semibold text-[#ff385c] hover:underline">
            Sign in
          </Link>{" "}
          to book this stay.
        </p>
      </div>
    );
  }

  if (isHost) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">This is your listing. Guests can book it.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Check in</span>
          <input
            type="date"
            required
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Check out</span>
          <input
            type="date"
            required
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Guests</span>
        <input
          type="number"
          min={1}
          max={capacity}
          value={guests}
          onChange={(event) => setGuests(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      {totals && (
        <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">
              ${pricePerNight} × {nights} {nights === 1 ? "night" : "nights"}
            </span>
            <span>${totals.subtotal}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Service fee</span>
            <span>${totals.serviceFee}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold">
            <span>Total</span>
            <span>${totals.total}</span>
          </div>
        </div>
      )}

      {availability.dates.length > 0 && (
        <p className="text-xs text-slate-500">
          Host-blocked dates: {availability.dates.join(", ")}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {bookingId ? (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Booking requested.{" "}
          <Link href="/trips" className="font-semibold underline">
            View your trips
          </Link>
        </div>
      ) : (
        <button
          type="submit"
          disabled={busy || nights < 1}
          className="w-full rounded-lg bg-[#ff385c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e00b3d] disabled:opacity-50"
        >
          {busy ? "Requesting..." : "Request to book"}
        </button>
      )}

      <p className="text-center text-xs text-slate-500">
        The host confirms your request before it is charged.
      </p>
    </form>
  );
}
