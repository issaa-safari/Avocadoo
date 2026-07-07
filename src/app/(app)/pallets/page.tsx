import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewPalletForm } from "./new-pallet-form";

export default async function PalletsPage() {
  const supabase = await createClient();

  const [{ data: pallets }, { data: coldRooms }, { data: allContents }] = await Promise.all([
    supabase
      .from("pallets")
      .select("pallet_id, pallet_code, status, build_datetime, cold_rooms ( name )")
      .order("build_datetime", { ascending: false })
      .limit(50),
    supabase.from("cold_rooms").select("cold_room_id, name").order("name"),
    supabase.from("pallet_run_contents").select("pallet_id, box_count"),
  ]);

  const boxesByPallet = new Map<string, number>();
  for (const c of allContents ?? []) {
    boxesByPallet.set(c.pallet_id, (boxesByPallet.get(c.pallet_id) ?? 0) + c.box_count);
  }

  return (
    <div className="stack">
      <h1>Palletizing</h1>

      <NewPalletForm coldRooms={coldRooms ?? []} />

      <table className="data-table">
        <thead>
          <tr>
            <th>Pallet</th>
            <th>Status</th>
            <th>Boxes</th>
            <th>Cold room</th>
            <th>Built</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(pallets ?? []).map((p) => (
            <tr key={p.pallet_id}>
              <td>{p.pallet_code}</td>
              <td>{p.status}</td>
              <td>{boxesByPallet.get(p.pallet_id) ?? 0}</td>
              <td>{p.cold_rooms?.name ?? "—"}</td>
              <td>{new Date(p.build_datetime).toLocaleString()}</td>
              <td>
                <Link className="button button-secondary" href={`/pallets/${p.pallet_id}`}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
          {(pallets ?? []).length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                No pallets yet. Start one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
