import { supabase } from "@/lib/supabase";
import type { UpdateProfileInput, UserProfile } from "@/types/domain";

export async function getCurrentProfile(): Promise<UserProfile> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user)
    throw userError ?? new Error("USER_NOT_FOUND");
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, timezone")
    .eq("id", userData.user.id)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    email: userData.user.email ?? "",
    displayName: data.display_name,
    timezone: data.timezone,
  };
}

export async function updateCurrentProfile(
  input: UpdateProfileInput,
): Promise<UserProfile> {
  const deviceTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user)
    throw userError ?? new Error("USER_NOT_FOUND");
  const { data, error } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName.trim(),
      timezone: deviceTimezone,
    })
    .eq("id", userData.user.id)
    .select("id, display_name, timezone")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    email: userData.user.email ?? "",
    displayName: data.display_name,
    timezone: data.timezone,
  };
}

export async function syncCurrentProfileTimezone() {
  const deviceTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;
  const { error } = await supabase
    .from("profiles")
    .update({ timezone: deviceTimezone })
    .eq("id", userData.user.id);
  if (error) throw error;
  return deviceTimezone;
}
