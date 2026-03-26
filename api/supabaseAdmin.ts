import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase admin configuration is incomplete. Add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getWorkspaceContextFromRequestAuthHeader(authorizationHeader?: string) {
  const token = authorizationHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    throw new Error("Supabase user verification failed for Meta persistence.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  if (!membership?.workspace_id) {
    throw new Error("No workspace membership found for this Supabase user.");
  }

  return {
    userId: userData.user.id,
    workspaceId: membership.workspace_id,
  };
}
