"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PROPERTY_TYPES } from "@/lib/types";

type FilterValues = {
  q: string;
  location: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  guests: string;
  checkIn: string;
  checkOut: string;
  sort: string;
  amenities: string;
};

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]";

export function ExploreFilters({ values }: { values: FilterValues }) {
  const router = useRouter();
  const [form, setForm] = useState<FilterValues>(values);
  const [busy, setBusy] = useState(false);

  function set(key: keyof FilterValues, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(form)) {
      if (value.trim()) params.set(key, value.trim());
    }
    router.push(params.size ? `/explore?${params.toString()}` : "/explore");
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3"
    >
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Where to?</span>
        <input
          value={form.q}
          onChange={(event) => set("q", event.target.value)}
          placeholder="Keyword or city"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Location</span>
        <input
          value={form.location}
          onChange={(event) => set("location", event.target.value)}
          placeholder="City or country"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Property type</span>
        <select
          value={form.type}
          onChange={(event) => set("type", event.target.value)}
          className={inputClass}
        >
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Min price / night</span>
        <input
          type="number"
          min={0}
          value={form.minPrice}
          onChange={(event) => set("minPrice", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Max price / night</span>
        <input
          type="number"
          min={0}
          value={form.maxPrice}
          onChange={(event) => set("maxPrice", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Guests</span>
        <input
          type="number"
          min={1}
          value={form.guests}
          onChange={(event) => set("guests", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Check in</span>
        <input
          type="date"
          value={form.checkIn}
          onChange={(event) => set("checkIn", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Check out</span>
        <input
          type="date"
          value={form.checkOut}
          onChange={(event) => set("checkOut", event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Amenities (comma separated)</span>
        <input
          value={form.amenities}
          onChange={(event) => set("amenities", event.target.value)}
          placeholder="WiFi, Pool"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Sort</span>
        <select
          value={form.sort}
          onChange={(event) => set("sort", event.target.value)}
          className={inputClass}
        >
          <option value="recommended">Recommended</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </label>

      <div className="flex items-end gap-2 lg:col-span-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-[#ff385c] px-5 py-2 text-sm font-semibold text-white hover:bg-[#e00b3d] disabled:opacity-50"
        >
          {busy ? "Searching..." : "Search stays"}
        </button>
        <button
          type="button"
          onClick={() => {
            setForm({
              q: "",
              location: "",
              type: "",
              minPrice: "",
              maxPrice: "",
              guests: "",
              checkIn: "",
              checkOut: "",
              sort: "recommended",
              amenities: "",
            });
            router.push("/explore");
          }}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
