"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavbarProps = { user: { name: string; avatarUrl: string } };

const links = [
  { href: "/explore", label: "Explore" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/trips", label: "Trips" },
  { href: "/host", label: "Host" },
];

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/explore" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight text-[#ff385c]">stayly</span>
          <span className="hidden text-xs text-slate-500 sm:inline">Find your place</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1 sm:gap-3">
          {links.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </Link>
            );
          })}

          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ff385c] text-xs font-bold text-white"
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              {initials}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                </div>
                <Link
                  href="/listings/new"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                >
                  List your place
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
