import { createClient } from "@/lib/supabase/server";
import { ReceivingForm } from "./receiving-form";

export default async function ReceivingPage() {
  const supabase = await createClient();

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const [{ data: suppliers }, { data: farmers }, { data: todayIntakes }, { data: recentIntakes }] =
    await Promise.all([
      supabase.from("suppliers").select("supplier_id, name").order("name"),
      supabase
        .from("farmers")
        .select("farmer_id, name, supplier_id, farm_id, farms ( name )")
        .order("name"),
      supabase
        .from("intake_batches")
        .select("gross_weight_kg")
        .gte("arrival_datetime", startOfToday.toISOString()),
      supabase
        .from("intake_batches")
        .select("intake_id, arrival_datetime, gross_weight_kg, bin_count, suppliers ( name ), farmers ( name )")
        .order("arrival_datetime", { ascending: false })
        .limit(10),
    ]);

  const todayCount = todayIntakes?.length ?? 0;
  const todayKg = (todayIntakes ?? []).reduce((sum, r) => sum + Number(r.gross_weight_kg), 0);

  return (
    <div className="stack">
      <h1>Receiving — New Delivery</h1>

      <ReceivingForm suppliers={suppliers ?? []} farmers={farmers ?? []} />

      <p className="muted">
        Today&apos;s intakes: {todayCount} batches · {todayKg.toLocaleString()} kg
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Arrived</th>
            <th>Supplier</th>
            <th>Farmer</th>
            <th>Crates</th>
            <th>Gross kg</th>
          </tr>
        </thead>
        <tbody>
          {(recentIntakes ?? []).map((i) => (
            <tr key={i.intake_id}>
              <td>{new Date(i.arrival_datetime).toLocaleString()}</td>
              <td>{i.suppliers?.name ?? "—"}</td>
              <td>{i.farmers?.name ?? "—"}</td>
              <td>{i.bin_count ?? "—"}</td>
              <td>{i.gross_weight_kg}</td>
            </tr>
          ))}
          {(recentIntakes ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                No intakes logged yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
