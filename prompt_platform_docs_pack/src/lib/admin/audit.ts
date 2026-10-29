import { createAdminClient } from "@/lib/supabase/admin";

export async function logAdminAction(input: {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const admin = createAdminClient();
  if (!admin) return false;

  const { error } = await admin.from("admin_audit_log").insert({
    actor_id: input.actorId,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Failed to write admin audit log entry", error);
    return false;
  }

  return true;
}
