import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Shell } from "@/components/ui";
export const dynamic = "force-dynamic";
const NAV = [
  { href: "/portal", label: "Dashboard", icon: "🏠" }, { href: "/portal/bills", label: "All Bills", icon: "🧾" }, { href: "/portal/pending", label: "Pending Bills", icon: "⏳" },
  { href: "/portal/paid", label: "Paid Bills", icon: "✅" }, { href: "/portal/payments", label: "Payment History", icon: "💰" }, { href: "/portal/ledger", label: "Ledger", icon: "📒" }, { href: "/portal/challans", label: "Delivery Challans", icon: "🚚" },
];
export default async function Layout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login"); if (s.mustChange) redirect("/change-password"); if (s.role !== "customer") redirect("/admin");
  return <Shell nav={NAV} brand="Mahadev Cement Product" user={s.username}>{children}</Shell>;
}
