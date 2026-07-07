"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/auth/org-context";

const VALID_DISPOSITIONS = ["approve", "hold", "reject"] as const;
type Disposition = (typeof VALID_DISPOSITIONS)[number];

export async function logQcCheck(formData: FormData) {
  const ctx = await getOrgContext();
  if (!ctx) throw new Error("Not authenticated");

  const runId = String(formData.get("run_id") ?? "");
  const disposition = String(formData.get("disposition") ?? "") as Disposition;
  const defects = formData.getAll("defects").map(String);
  const notes = String(formData.get("notes") ?? "");
  const photos = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!runId) throw new Error("No run selected");
  if (!VALID_DISPOSITIONS.includes(disposition)) throw new Error("Invalid disposition");
  // Server-side photo rule (QC-002 AC) — also re-enforced inside the
  // log_qc_check RPC itself, so even a caller bypassing this action
  // entirely cannot log a photo-less hold/reject.
  if (disposition !== "approve" && photos.length === 0) {
    throw new Error("A photo is required for hold/reject dispositions");
  }

  const supabase = await createClient();

  const photoPaths: string[] = [];
  for (const photo of photos) {
    const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "photo.jpg";
    const path = `${ctx.orgId}/qc_check/${crypto.randomUUID()}/${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("stage-photos")
      .upload(path, photo, { contentType: photo.type || "image/jpeg" });
    if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);
    photoPaths.push(path);
  }

  const { error } = await supabase.rpc("log_qc_check", {
    p_run_id: runId,
    p_disposition: disposition,
    p_defects: defects,
    p_notes: notes || undefined,
    p_photo_urls: photoPaths,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/qc");
}
