import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: supplierCount }, { count: farmerCount }, { count: farmCount }, { count: intakeCount }] =
    await Promise.all([
      supabase.from("suppliers").select("*", { count: "exact", head: true }),
      supabase.from("farmers").select("*", { count: "exact", head: true }),
      supabase.from("farms").select("*", { count: "exact", head: true }),
      supabase.from("intake_batches").select("*", { count: "exact", head: true }),
    ]);

  return (
    <div className="stack">
      <h1>Dashboard</h1>
      <div className="card" style={{ display: "flex", gap: "2rem" }}>
        <Stat label="Suppliers" value={supplierCount ?? 0} />
        <Stat label="Farmers" value={farmerCount ?? 0} />
        <Stat label="Farms" value={farmCount ?? 0} />
        <Stat label="Intake batches" value={intakeCount ?? 0} />
      </div>
      <p className="muted">
        Start by adding a supplier and farmer under Master Data, then log a delivery under
        Receiving.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{value}</div>
      <div className="muted">{label}</div>
    </div>
  );
}
