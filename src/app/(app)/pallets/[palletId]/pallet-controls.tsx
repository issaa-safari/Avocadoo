"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignColdRoom, closePallet } from "./actions";

type ColdRoom = { cold_room_id: string; name: string };

export function ColdRoomForm({
  palletId,
  coldRoomId,
  coldRooms,
}: {
  palletId: string;
  coldRoomId: string | null;
  coldRooms: ColdRoom[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(coldRoomId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleMove() {
    setError(null);
    startTransition(async () => {
      const result = await assignColdRoom(palletId, selected);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="stack">
      <div className="field">
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">— not in cold storage —</option>
          {coldRooms.map((c) => (
            <option key={c.cold_room_id} value={c.cold_room_id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="error-text">{error}</p>}
      <button className="button button-secondary" type="button" disabled={isPending} onClick={handleMove}>
        {isPending ? "Moving…" : "Move"}
      </button>
    </div>
  );
}

export function ClosePalletButton({ palletId }: { palletId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    setError(null);
    startTransition(async () => {
      const result = await closePallet(palletId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="stack">
      {error && <p className="error-text">{error}</p>}
      <button className="button button-primary" type="button" disabled={isPending} onClick={handleClose}>
        {isPending ? "Closing…" : "Close pallet"}
      </button>
    </div>
  );
}
