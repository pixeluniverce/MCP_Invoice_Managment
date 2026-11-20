import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Mahadev Cement Product", description: "Billing and customer management" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}