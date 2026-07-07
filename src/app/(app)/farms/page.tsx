import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "@/components/client-form";
import { ActionButton } from "@/components/action-button";
import { createFarm, createRegion, deleteFarm } from "./actions";

export default async function FarmsPage() {
  const supabase = await createClient();
  const [{ data: farms }, { data: regions }] = await Promise.all([
    supabase
      .from("farms")
      .select("farm_id, name, block_label, regions ( name )")
      .order("name"),
    supabase.from("regions").select("region_id, name").order("name"),
  ]);

  return (
    <div className="stack">
      <h1>Farms</h1>

      <div className="card stack">
        <strong>Quick-add region</strong>
        <p className="muted">Every farm requires a region. Add one here if it isn&apos;t listed yet.</p>
        <ClientForm
          action={createRegion}
          submitLabel="Add region"
          pendingLabel="Adding…"
          className="stack"
          submitClassName="button button-secondary"
        >
          <input name="region_name" placeholder="Region name" required />
        </ClientForm>
        {(regions ?? []).length > 0 && (
          <p className="muted">Existing: {(regions ?? []).map((r) => r.name).join(", ")}</p>
        )}
      </div>

      <ClientForm
        action={createFarm}
        submitLabel="Add farm"
        pendingLabel="Adding…"
        submitDisabled={(regions ?? []).length === 0}
      >
        <div className="field">
          <label htmlFor="name">Farm name</label>
          <input id="name" name="name" required />
        </div>
        <div className="field">
          <label htmlFor="region_id">Region</label>
          <select id="region_id" name="region_id" required defaultValue="">
            <option value="" disabled>
              Select a region
            </option>
            {(regions ?? []).map((r) => (
              <option key={r.region_id} value={r.region_id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="block_label">Block (optional)</label>
          <input id="block_label" name="block_label" placeholder="e.g. Block 3" />
        </div>
      </ClientForm>

      <table className="data-table">
        <thead>
          <tr>
            <th>Farm</th>
            <th>Region</th>
            <th>Block</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(farms ?? []).map((f) => (
            <tr key={f.farm_id}>
              <td>{f.name}</td>
              <td>{f.regions?.name ?? "—"}</td>
              <td>{f.block_label ?? "—"}</td>
              <td>
                <ActionButton action={deleteFarm.bind(null, f.farm_id)} label="Delete" pendingLabel="Deleting…" />
              </td>
            </tr>
          ))}
          {(farms ?? []).length === 0 && (
            <tr>
              <td colSpan={4} className="muted">
                No farms yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
