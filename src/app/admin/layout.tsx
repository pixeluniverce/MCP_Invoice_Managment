import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Shell } from "@/components/ui";
export const dynamic = "force-dynamic";
const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" }, { href: "/admin/invoices/new", label: "New Invoice", icon: "➕" }, { href: "/admin/invoices", label: "All Invoices", icon: "🧾" },
  { href: "/admin/payments", label: "Payments", icon: "💰" }, { href: "/admin/outstanding", label: "Outstanding", icon: "⏳" }, { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/products", label: "Products", icon: "📦" }, { href: "/admin/challans", label: "Delivery Challans", icon: "🚚" }, { href: "/admin/whatsapp", label: "WhatsApp", icon: "💬" },
  { href: "/admin/reports", label: "Reports", icon: "📈" }, { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];
export default async function Layout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login"); if (s.mustChange) redirect("/change-password"); if (s.role !== "admin") redirect("/portal");
  return <Shell nav={NAV} brand="Mahadev Cement Product" user={s.username}>{children}</Shell>;
}
