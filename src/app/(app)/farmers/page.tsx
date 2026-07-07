import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "@/components/client-form";
import { ActionButton } from "@/components/action-button";
import { createFarmer, deleteFarmer } from "./actions";
import { AssignFarmSelect } from "./assign-farm-select";

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

      <ClientForm
        action={createFarmer}
        submitLabel="Add farmer"
        pendingLabel="Adding…"
        submitDisabled={(suppliers ?? []).length === 0}
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
          <label htmlFor="farm_id">Farm / block</label>
          <select id="farm_id" name="farm_id" defaultValue="">
            <option value="">None yet</option>
            {(farms ?? []).map((f) => (
              <option key={f.farm_id} value={f.farm_id}>
                {f.name}
              </option>
            ))}
          </select>
          <p className="muted">
            A farmer without a farm cannot receive deliveries — the intake must trace to a farm. Add farms on
            the Farms page.
          </p>
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" />
        </div>
        {(suppliers ?? []).length === 0 && (
          <p className="muted">Add a supplier first — every farmer must belong to one.</p>
        )}
      </ClientForm>

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
              <td>
                {f.farms?.name ?? <AssignFarmSelect farmerId={f.farmer_id} farms={farms ?? []} />}
              </td>
              <td>{f.phone ?? "—"}</td>
              <td>
                <ActionButton
                  action={deleteFarmer.bind(null, f.farmer_id)}
                  label="Delete"
                  pendingLabel="Deleting…"
                />
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
