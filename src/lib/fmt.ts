export const inr = (n: any) => "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const fdate = (d: any) => { if (!d) return "-"; const [y, m, dd] = String(d).slice(0, 10).split("-"); return `${dd} ${MON[+m - 1]} ${y}`; };
export const fdt = (d: any) => d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) : "-";
export const today = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
