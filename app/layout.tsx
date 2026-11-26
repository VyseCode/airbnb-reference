import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Stayly — Find your next stay",
    template: "%s | Stayly",
  },
  description:
    "A short-term stay marketplace: discover places, book dates, host your own home, and review completed stays.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
