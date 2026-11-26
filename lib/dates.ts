const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDay(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function dayToMs(value: string): number | null {
  if (!isValidDay(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function nightsBetween(checkIn: string, checkOut: string): number | null {
  const start = dayToMs(checkIn);
  const end = dayToMs(checkOut);
  if (start === null || end === null || end <= start) return null;
  return Math.round((end - start) / 86_400_000);
}

export function rangesOverlap(
  aIn: string,
  aOut: string,
  bIn: string,
  bOut: string,
): boolean {
  const aStart = dayToMs(aIn);
  const aEnd = dayToMs(aOut);
  const bStart = dayToMs(bIn);
  const bEnd = dayToMs(bOut);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) {
    return false;
  }
  return aStart < bEnd && bStart < aEnd;
}

export function nightsInRange(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  const start = dayToMs(checkIn);
  const end = dayToMs(checkOut);
  if (start === null || end === null || end <= start) return nights;
  for (let ms = start; ms < end; ms += 86_400_000) {
    nights.push(new Date(ms).toISOString().slice(0, 10));
  }
  return nights;
}

export const SERVICE_FEE_RATE = 0.12;

export function bookingTotals(pricePerNight: number, nights: number) {
  const subtotal = Math.round(pricePerNight * nights * 100) / 100;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  return { subtotal, serviceFee, total: Math.round((subtotal + serviceFee) * 100) / 100 };
}
