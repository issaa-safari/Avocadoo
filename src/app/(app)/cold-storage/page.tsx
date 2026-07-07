import { createClient } from "@/lib/supabase/server";
import { AddColdRoomForm, LogTemperatureForm } from "./cold-storage-forms";

export default async function ColdStoragePage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string; from?: string; to?: string }>;
}) {
  const { room, from, to } = await searchParams;
  const supabase = await createClient();

  const { data: coldRooms } = await supabase
    .from("cold_rooms")
    .select("cold_room_id, name, target_temp_c")
    .order("name");

  // COLD-001 AC: temperature history queryable by cold room and time range.
  let logsQuery = supabase
    .from("cold_storage_logs")
    .select("log_id, cold_room_id, temp_c, humidity_pct, source, recorded_at, cold_rooms ( name )")
    .order("recorded_at", { ascending: false })
    .limit(200);
  if (room) logsQuery = logsQuery.eq("cold_room_id", room);
  if (from) logsQuery = logsQuery.gte("recorded_at", from);
  if (to) logsQuery = logsQuery.lte("recorded_at", `${to}T23:59:59`);
  const { data: logs } = await logsQuery;

  const { data: storedPallets } = await supabase
    .from("pallets")
    .select("pallet_id, cold_room_id")
    .not("cold_room_id", "is", null);
  const palletsByRoom = new Map<string, number>();
  for (const p of storedPallets ?? []) {
    if (p.cold_room_id) palletsByRoom.set(p.cold_room_id, (palletsByRoom.get(p.cold_room_id) ?? 0) + 1);
  }

  return (
    <div className="stack">
      <h1>Cold Storage</h1>

      <div className="card stack">
        <strong>Cold rooms</strong>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Target (°C)</th>
              <th>Pallets stored</th>
              <th>Last reading</th>
            </tr>
          </thead>
          <tbody>
            {(coldRooms ?? []).map((c) => {
              const last = (logs ?? []).find((l) => l.cold_room_id === c.cold_room_id);
              return (
                <tr key={c.cold_room_id}>
                  <td>{c.name}</td>
                  <td>{c.target_temp_c ?? "—"}</td>
                  <td>{palletsByRoom.get(c.cold_room_id) ?? 0}</td>
                  <td>
                    {last
                      ? `${last.temp_c}°C · ${new Date(last.recorded_at).toLocaleString()}`
                      : "no readings yet"}
                  </td>
                </tr>
              );
            })}
            {(coldRooms ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  No cold rooms yet. Add one below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddColdRoomForm />
      <LogTemperatureForm coldRooms={coldRooms ?? []} />

      <div className="card stack">
        <strong>Temperature history</strong>
        <form method="get" className="stack">
          <div className="field">
            <label htmlFor="room">Cold room</label>
            <select id="room" name="room" defaultValue={room ?? ""}>
              <option value="">All rooms</option>
              {(coldRooms ?? []).map((c) => (
                <option key={c.cold_room_id} value={c.cold_room_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="from">From</label>
            <input id="from" name="from" type="date" defaultValue={from ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="to">To</label>
            <input id="to" name="to" type="date" defaultValue={to ?? ""} />
          </div>
          <button className="button button-secondary" type="submit">
            Filter
          </button>
        </form>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cold room</th>
              <th>Temp (°C)</th>
              <th>Humidity (%)</th>
              <th>Source</th>
              <th>Recorded</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((l) => (
              <tr key={l.log_id}>
                <td>{l.cold_rooms?.name ?? "—"}</td>
                <td>{l.temp_c}</td>
                <td>{l.humidity_pct ?? "—"}</td>
                <td>{l.source}</td>
                <td>{new Date(l.recorded_at).toLocaleString()}</td>
              </tr>
            ))}
            {(logs ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  No readings match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
