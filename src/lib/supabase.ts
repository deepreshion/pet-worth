import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
export const configured = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL &&
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "missing-local-publishable-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      lock: processLock,
    },
  },
);
