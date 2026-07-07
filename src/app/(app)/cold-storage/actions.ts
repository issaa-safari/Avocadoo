"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

export type ColdStorageActionState = { error: string | null };

export async function createColdRoom(
  _prevState: ColdStorageActionState,
  formData: FormData,
): Promise<ColdStorageActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const name = String(formData.get("name") ?? "").trim();
  const targetRaw = String(formData.get("target_temp_c") ?? "").trim();
  const targetTempC = targetRaw === "" ? null : Number(targetRaw);

  if (!name) return { error: "Cold room name is required" };
  if (targetTempC !== null && !Number.isFinite(targetTempC)) {
    return { error: "Target temperature must be a number" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cold_rooms").insert({
    org_id: ctx.orgId,
    name,
    target_temp_c: targetTempC,
  });

  if (error) {
    if (error.code === "23505") return { error: `A cold room named "${name}" already exists` };
    return { error: error.message };
  }

  revalidatePath("/cold-storage");
  return { error: null };
}

export async function logTemperature(
  _prevState: ColdStorageActionState,
  formData: FormData,
): Promise<ColdStorageActionState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const coldRoomId = String(formData.get("cold_room_id") ?? "");
  const tempC = Number(formData.get("temp_c"));
  const humidityRaw = String(formData.get("humidity_pct") ?? "").trim();
  const humidityPct = humidityRaw === "" ? null : Number(humidityRaw);

  if (!coldRoomId) return { error: "Pick a cold room" };
  if (!Number.isFinite(tempC)) return { error: "Temperature must be a number" };
  if (humidityPct !== null && (!Number.isFinite(humidityPct) || humidityPct < 0 || humidityPct > 100)) {
    return { error: "Humidity must be between 0 and 100" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cold_storage_logs").insert({
    org_id: ctx.orgId,
    cold_room_id: coldRoomId,
    temp_c: tempC,
    humidity_pct: humidityPct,
    recorded_by: ctx.userId,
  });

  if (error) return { error: error.message };

  revalidatePath("/cold-storage");
  return { error: null };
}
