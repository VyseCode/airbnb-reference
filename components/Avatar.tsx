type AvatarProps = {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function Avatar({ name, src, size = "md" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={`${sizes[size]} inline-flex shrink-0 items-center justify-center rounded-full bg-[#ff385c] font-semibold text-white`}
    >
      {initials || "?"}
    </span>
  );
}
