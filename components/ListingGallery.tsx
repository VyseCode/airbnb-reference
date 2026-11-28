import Image from "next/image";

export function ListingGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
        No photo yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {images.map((src, index) => {
        const hero = index === 0;
        const alt = `${title} photo ${index + 1}`;
        return (
          <div
            key={src}
            className={`relative overflow-hidden rounded-lg bg-slate-100 ${
              hero ? "col-span-full aspect-[16/10]" : "aspect-[4/3]"
            }`}
          >
            {src.startsWith("/cdn/") ? (
              <Image
                src={src}
                alt={alt}
                fill
                sizes={
                  hero
                    ? "(max-width: 1024px) 100vw, 70vw"
                    : "(max-width: 640px) 50vw, 33vw"
                }
                className="object-cover"
                priority={hero}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt}
                loading={hero ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
