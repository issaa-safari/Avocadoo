"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

export type NewPalletState = { error: string | null };

export async function createPallet(_prevState: NewPalletState, formData: FormData): Promise<NewPalletState> {
  const ctx = await getOrgContext();
  if (!ctx) return { error: "Not authenticated" };

  const coldRoomId = String(formData.get("cold_room_id") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pallets")
    .insert({
      org_id: ctx.orgId,
      cold_room_id: coldRoomId || null,
      built_by: ctx.userId,
    })
    .select("pallet_id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/pallets");
  redirect(`/pallets/${data.pallet_id}`);
}
