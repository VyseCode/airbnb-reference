"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PROPERTY_TYPES, type ListingDTO } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#ff385c] focus:ring-1 focus:ring-[#ff385c]";

type ListingFormProps = { initial?: ListingDTO };

export function ListingForm({ initial }: ListingFormProps) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [propertyType, setPropertyType] = useState<string>(
    initial?.propertyType ?? "apartment",
  );
  const [city, setCity] = useState(initial?.location.city ?? "");
  const [country, setCountry] = useState(initial?.location.country ?? "");
  const [address, setAddress] = useState(initial?.location.address ?? "");
  const [price, setPrice] = useState(String(initial?.pricePerNight ?? 100));
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 2));
  const [amenities, setAmenities] = useState((initial?.amenities ?? []).join(", "));
  const [images, setImages] = useState((initial?.images ?? []).join(", "));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      propertyType,
      city: city.trim(),
      country: country.trim(),
      address: address.trim(),
      pricePerNight: Number(price),
      capacity: Number(capacity),
      amenities: amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      images: images
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch(
        editing ? `/api/listings/${initial!.id}` : "/api/listings",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json()) as {
        listing?: ListingDTO;
        error?: string;
      };
      if (!response.ok || !data.listing) {
        setError(data.error ?? "Could not save your listing");
        return;
      }
      router.push(`/listings/${data.listing.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-5 text-2xl font-semibold text-slate-900">
          {editing ? "Edit your listing" : "List your place"}
        </h1>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              minLength={3}
              maxLength={120}
              required
              className={inputClass}
              placeholder="Oceanview Loft in Anjuna"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={20}
              maxLength={3000}
              required
              rows={5}
              className={inputClass}
              placeholder="Tell guests what makes your place special..."
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Property type</span>
              <select
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value)}
                className={inputClass}
              >
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Price per night (USD)
              </span>
              <input
                type="number"
                min={1}
                max={10000}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                required
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">City</span>
              <input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                required
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Country</span>
              <input
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                required
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Address</span>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Capacity</span>
              <input
                type="number"
                min={1}
                max={20}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                required
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Amenities (comma separated)
            </span>
            <input
              value={amenities}
              onChange={(event) => setAmenities(event.target.value)}
              className={inputClass}
              placeholder="WiFi, Pool, Kitchen"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Image paths or URLs (comma separated)
            </span>
            <input
              value={images}
              onChange={(event) => setImages(event.target.value)}
              className={inputClass}
              placeholder="/images/stay-1.svg"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3 border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-[#ff385c] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#e00b3d] disabled:opacity-50"
          >
            {busy ? "Saving..." : editing ? "Save changes" : "Create listing"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
