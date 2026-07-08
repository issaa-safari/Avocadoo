import { createClient } from "@/lib/supabase/server";
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
        <form
          style={{ display: "flex", gap: "0.6rem" }}
          action={async (formData) => {
            "use server";
            await createRegion(formData);
          }}
        >
          <input name="region_name" placeholder="Region name" required style={{ flex: 1 }} />
          <button className="button button-secondary" type="submit">
            Add region
          </button>
        </form>
        {(regions ?? []).length > 0 && (
          <p className="muted">Existing: {(regions ?? []).map((r) => r.name).join(", ")}</p>
        )}
      </div>

      <form
        className="card stack"
        action={async (formData) => {
          "use server";
          await createFarm(formData);
        }}
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
        <button className="button button-primary" type="submit" disabled={(regions ?? []).length === 0}>
          Add farm
        </button>
      </form>

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
                <form
                  action={async () => {
                    "use server";
                    await deleteFarm(f.farm_id);
                  }}
                >
                  <button className="button button-secondary" type="submit">
                    Delete
                  </button>
                </form>
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
