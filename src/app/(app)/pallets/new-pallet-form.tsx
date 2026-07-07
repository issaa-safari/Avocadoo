"use client";

import { useActionState } from "react";
import { createPallet, type NewPalletState } from "./actions";

type ColdRoom = { cold_room_id: string; name: string };

const initialState: NewPalletState = { error: null };

export function NewPalletForm({ coldRooms }: { coldRooms: ColdRoom[] }) {
  const [state, formAction, isPending] = useActionState(createPallet, initialState);

  return (
    <form className="card stack" action={formAction}>
      <strong>Start a new pallet</strong>
      <div className="field">
        <label htmlFor="cold_room_id">Cold room (optional, can be set later)</label>
        <select id="cold_room_id" name="cold_room_id" defaultValue="">
          <option value="">— none yet —</option>
          {coldRooms.map((c) => (
            <option key={c.cold_room_id} value={c.cold_room_id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {state.error && <p className="error-text">{state.error}</p>}
      <button className="button button-primary" type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "New pallet"}
      </button>
    </form>
  );
}
