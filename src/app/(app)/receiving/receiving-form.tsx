"use client";

import { useMemo, useState, useTransition } from "react";
import { createIntakeBatch } from "./actions";

type Supplier = { supplier_id: string; name: string };
type Farmer = {
  farmer_id: string;
  name: string;
  supplier_id: string;
  farm_id: string | null;
  farms: { name: string } | null;
};

export function ReceivingForm({
  suppliers,
  farmers,
}: {
  suppliers: Supplier[];
  farmers: Farmer[];
}) {
  const [supplierId, setSupplierId] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredFarmers = useMemo(
    () => farmers.filter((f) => f.supplier_id === supplierId),
    [farmers, supplierId],
  );
  const selectedFarmer = filteredFarmers.find((f) => f.farmer_id === farmerId);

  const farmerHasNoFarm = !!selectedFarmer && !selectedFarmer.farm_id;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createIntakeBatch(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSupplierId("");
      setFarmerId("");
      (document.getElementById("receiving-form") as HTMLFormElement | null)?.reset();
    });
  }

  return (
    <form id="receiving-form" className="card stack" action={handleSubmit}>
      <div className="field">
        <label htmlFor="supplier_id">Supplier</label>
        <select
          id="supplier_id"
          name="supplier_id"
          required
          value={supplierId}
          onChange={(e) => {
            setSupplierId(e.target.value);
            setFarmerId("");
          }}
        >
          <option value="" disabled>
            Select a supplier
          </option>
          {suppliers.map((s) => (
            <option key={s.supplier_id} value={s.supplier_id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="farmer_id">Farmer</label>
        <select
          id="farmer_id"
          name="farmer_id"
          required
          disabled={!supplierId}
          value={farmerId}
          onChange={(e) => setFarmerId(e.target.value)}
        >
          <option value="" disabled>
            {supplierId ? "Select a farmer" : "Select a supplier first"}
          </option>
          {filteredFarmers.map((f) => (
            <option key={f.farmer_id} value={f.farmer_id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Farm / block</label>
        <input
          value={
            selectedFarmer
              ? selectedFarmer.farms?.name ?? "No farm on file for this farmer"
              : "(auto from farmer)"
          }
          disabled
          readOnly
        />
        <input type="hidden" name="farm_id" value={selectedFarmer?.farm_id ?? ""} />
        {farmerHasNoFarm && (
          <p className="error-text">
            This farmer has no farm/block on file — add one on the Farmers page before logging a delivery,
            so the intake stays traceable to a farm.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="variety">Variety</label>
        <input id="variety" name="variety" placeholder="e.g. Hass" />
      </div>

      <div style={{ display: "flex", gap: "0.8rem" }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="bin_count">Crates</label>
          <input id="bin_count" name="bin_count" type="number" min={0} step={1} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="gross_weight_kg">Gross weight (kg)</label>
          <input id="gross_weight_kg" name="gross_weight_kg" type="number" min={0} step="0.1" required />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.8rem" }}>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="transport_plate">Truck plate</label>
          <input id="transport_plate" name="transport_plate" />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="driver_name">Driver</label>
          <input id="driver_name" name="driver_name" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="field_temp_c">Field temp (°C)</label>
        <input id="field_temp_c" name="field_temp_c" type="number" step="0.1" />
      </div>

      {error && <p className="error-text">{error}</p>}
      {selectedFarmer === undefined && farmerId && (
        <p className="error-text">Selected farmer is no longer valid — please reselect.</p>
      )}

      <button
        className="button button-primary"
        type="submit"
        disabled={isPending || !farmerId || farmerHasNoFarm}
      >
        {isPending ? "Saving…" : "Save intake"}
      </button>
    </form>
  );
}
