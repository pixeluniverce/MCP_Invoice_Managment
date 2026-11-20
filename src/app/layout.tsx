import "./globals.css";
import type { Metadata, Viewport } from "next";
export const metadata: Metadata = { title: "Mahadev Cement Product", description: "Billing & customer account management" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
