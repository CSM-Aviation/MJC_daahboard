import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Madera Jet Center Dashboard",
  description: "Internal dashboard for Madera Jet Center",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--mjc-gray)]">{children}</body>
    </html>
  );
}
