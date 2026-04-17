import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naze Calendar",
  description: "Interior design scheduling, clients, and contracts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
