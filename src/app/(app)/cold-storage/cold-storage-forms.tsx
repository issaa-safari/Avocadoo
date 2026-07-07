"use client";

import { useActionState } from "react";
import { createColdRoom, logTemperature, type ColdStorageActionState } from "./actions";

type ColdRoom = { cold_room_id: string; name: string; target_temp_c: number | null };

const initialState: ColdStorageActionState = { error: null };

export function AddColdRoomForm() {
  const [state, formAction, isPending] = useActionState(createColdRoom, initialState);

  return (
    <form className="card stack" action={formAction}>
      <strong>Add cold room</strong>
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" placeholder="e.g. Cold Room 1" required />
      </div>
      <div className="field">
        <label htmlFor="target_temp_c">Target temp (°C, optional)</label>
        <input id="target_temp_c" name="target_temp_c" type="number" step="0.1" />
      </div>
      {state.error && <p className="error-text">{state.error}</p>}
      <button className="button button-primary" type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add cold room"}
      </button>
    </form>
  );
}

export function LogTemperatureForm({ coldRooms }: { coldRooms: ColdRoom[] }) {
  const [state, formAction, isPending] = useActionState(logTemperature, initialState);

  return (
    <form className="card stack" action={formAction}>
      <strong>Log temperature</strong>
      <div className="field">
        <label htmlFor="cold_room_id">Cold room</label>
        <select id="cold_room_id" name="cold_room_id" required defaultValue="">
          <option value="" disabled>
            Select a cold room
          </option>
          {coldRooms.map((c) => (
            <option key={c.cold_room_id} value={c.cold_room_id}>
              {c.name}
              {c.target_temp_c !== null ? ` (target ${c.target_temp_c}°C)` : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="temp_c">Temperature (°C)</label>
        <input id="temp_c" name="temp_c" type="number" step="0.1" required />
      </div>
      <div className="field">
        <label htmlFor="humidity_pct">Humidity (%, optional)</label>
        <input id="humidity_pct" name="humidity_pct" type="number" min={0} max={100} step="0.1" />
      </div>
      {state.error && <p className="error-text">{state.error}</p>}
      <button className="button button-primary" type="submit" disabled={coldRooms.length === 0 || isPending}>
        {isPending ? "Logging…" : "Log reading"}
      </button>
      {coldRooms.length === 0 && <p className="muted">Add a cold room first.</p>}
    </form>
  );
}
