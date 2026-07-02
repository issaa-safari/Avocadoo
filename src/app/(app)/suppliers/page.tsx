import { createClient } from "@/lib/supabase/server";
import { createSupplier, deleteSupplier } from "./actions";

export default async function SuppliersPage() {
  const supabase = await createClient();
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("supplier_id, name, contact_name, contact_phone, contact_email")
    .order("name");

  return (
    <div className="stack">
      <h1>Suppliers</h1>

      <form
        className="card stack"
        action={async (formData) => {
          "use server";
          await createSupplier(formData);
        }}
      >
        <div className="field">
          <label htmlFor="name">Supplier name</label>
          <input id="name" name="name" required />
        </div>
        <div className="field">
          <label htmlFor="contact_name">Contact name</label>
          <input id="contact_name" name="contact_name" />
        </div>
        <div className="field">
          <label htmlFor="contact_phone">Contact phone</label>
          <input id="contact_phone" name="contact_phone" />
        </div>
        <div className="field">
          <label htmlFor="contact_email">Contact email</label>
          <input id="contact_email" name="contact_email" type="email" />
        </div>
        <button className="button button-primary" type="submit">
          Add supplier
        </button>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Phone</th>
            <th>Email</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {(suppliers ?? []).map((s) => (
            <tr key={s.supplier_id}>
              <td>{s.name}</td>
              <td>{s.contact_name ?? "—"}</td>
              <td>{s.contact_phone ?? "—"}</td>
              <td>{s.contact_email ?? "—"}</td>
              <td>
                <form
                  action={async () => {
                    "use server";
                    await deleteSupplier(s.supplier_id);
                  }}
                >
                  <button className="button button-secondary" type="submit">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {(suppliers ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                No suppliers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
