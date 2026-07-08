import { createClient } from "@/lib/supabase/server";
import { createFarmer, deleteFarmer } from "./actions";

export default async function FarmersPage() {
  const supabase = await createClient();
  const [{ data: farmers }, { data: suppliers }, { data: farms }] = await Promise.all([
    supabase
      .from("farmers")
      .select("farmer_id, name, phone, suppliers ( name ), farms ( name )")
      .order("name"),
    supabase.from("suppliers").select("supplier_id, name").order("name"),
    supabase.from("farms").select("farm_id, name").order("name"),
  ]);

  return (
    <div className="stack">
      <h1>Farmers</h1>

      <form
        className="card stack"
        action={async (formData) => {
          "use server";
          await createFarmer(formData);
        }}
      >
        <div className="field">
          <label htmlFor="name">Farmer name</label>
          <input id="name" name="name" required />
        </div>
        <div className="field">
          <label htmlFor="supplier_id">Supplier</label>
          <select id="supplier_id" name="supplier_id" required defaultValue="">
            <option value="" disabled>
              Select a supplier
            </option>
            {(suppliers ?? []).map((s) => (
              <option key={s.supplier_id} value={s.supplier_id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="farm_id">Farm (optional)</label>
          <select id="farm_id" name="farm_id" defaultValue="">
            <option value="">None</option>
            {(farms ?? []).map((f) => (
              <option key={f.farm_id} value={f.farm_id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" />
        </div>
        <button className="button button-primary" type="submit" disabled={(suppliers ?? []).length === 0}>
          Add farmer
        </button>
        {(suppliers ?? []).length === 0 && (
          <p className="muted">Add a supplier first — every farmer must belong to one.</p>
        )}
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Supplier</th>
            <th>Farm</th>
            <th>Phone</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(farmers ?? []).map((f) => (
            <tr key={f.farmer_id}>
              <td>{f.name}</td>
              <td>{f.suppliers?.name ?? "—"}</td>
              <td>{f.farms?.name ?? "—"}</td>
              <td>{f.phone ?? "—"}</td>
              <td>
                <form
                  action={async () => {
                    "use server";
                    await deleteFarmer(f.farmer_id);
                  }}
                >
                  <button className="button button-secondary" type="submit">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {(farmers ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                No farmers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
