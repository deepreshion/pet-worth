import { clearPetPhotoCache } from "@/lib/petPhotoCache";
import { authErrorCode } from "@/utils/authErrors";
import { OTP_LENGTH } from "@/utils/emailOtp";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/query";
import {
  clearMedicalNotifications,
  syncMedicalNotifications,
} from "@/services/notifications";
import { clearPrivateFiles } from "@/platform/files";
import { syncCurrentProfileTimezone } from "@/services/profile";
import { reconcileStorageCleanup } from "@/services/storageCleanup";
import { captureTechnicalError } from "@/lib/monitoring";
interface Auth {
  ready: boolean;
  notificationWarning: boolean;
  session: Session | null;
  sendEmailOtp(email: string): Promise<void>;
  verifyEmailOtp(email: string, token: string): Promise<void>;
  completeMagicLink(code: string): Promise<void>;
  signOut(): Promise<void>;
}
const Context = createContext<Auth>(null!);
export const useAuth = () => useContext(Context);
const completed = new Set<string>();
const pending = new Map<string, Promise<void>>();
export async function completeMagicLink(code: string) {
  if (completed.has(code)) return;
  if (pending.has(code)) return pending.get(code)!;
  const work = (async () => {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    completed.add(code);
  })();
  pending.set(code, work);
  try {
    await work;
  } finally {
    pending.delete(code);
  }
}
export async function sendEmailOtp(email: string) {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: "petworth://auth/callback",
        shouldCreateUser: true,
      },
    });
    if (error) throw error;
  } catch (error) {
    throw new Error(authErrorCode(error, "send"));
  }
}
export async function verifyEmailOtp(email: string, token: string) {
  if (token.length !== OTP_LENGTH || !/^\d+$/.test(token))
    throw new Error("AUTH_OTP_FORMAT");
  try {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });
    if (error) throw error;
  } catch (error) {
    throw new Error(authErrorCode(error, "verify"));
  }
}
export function AuthProvider({ children }: PropsWithChildren) {
  const [notificationWarning, setNotificationWarning] = useState(false);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const current = useRef<string | null>(null);
  useEffect(() => {
    let alive = true;
    let revision = 0;
    const update = (value: Session | null) => {
      if (!alive) return;
      if (current.current !== (value?.user.id ?? null)) {
        queryClient.clear();
        // Preserve the disk cache on session restoration; clear it when leaving
        // an account or switching to another one.
        if (current.current)
          void clearPetPhotoCache().catch((error) =>
            captureTechnicalError(error, "clear_photo_cache"),
          );
        try {
          clearPrivateFiles();
        } catch (error) {
          captureTechnicalError(error, "clear_private_files");
        }
        void clearMedicalNotifications().catch((error) =>
          captureTechnicalError(error, "clear_notifications"),
        );
        setNotificationWarning(false);
        current.current = value?.user.id ?? null;
      }
      setSession(value);
      setReady(true);
    };
    const subscription = supabase.auth.onAuthStateChange((_event, value) => {
      revision++;
      update(value);
    }).data.subscription;
    const start = revision;
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) captureTechnicalError(error, "restore_session");
        if (revision === start) update(data.session);
      })
      .catch((error) => {
        captureTechnicalError(error, "restore_session");
        if (revision === start) update(null);
      });
    const refresh = (state: string) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    refresh(AppState.currentState ?? "active");
    const app = AppState.addEventListener("change", refresh);
    return () => {
      alive = false;
      subscription.unsubscribe();
      app.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const reconcile = async () => {
      if (!session) return;
      try {
        await syncCurrentProfileTimezone();
        await reconcileStorageCleanup();
        const result = await syncMedicalNotifications();
        setNotificationWarning(result.failed || result.omitted > 0);
        await queryClient.invalidateQueries();
      } catch (error) {
        setNotificationWarning(true);
        captureTechnicalError(error, "resume_reconcile");
      }
    };
    void reconcile();
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") void reconcile();
    });
    return () => app.remove();
  }, [ready, session]);
  return (
    <Context.Provider
      value={{
        ready,
        notificationWarning,
        session,
        completeMagicLink,
        sendEmailOtp,
        verifyEmailOtp,
        async signOut() {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          queryClient.clear();
          await clearPetPhotoCache().catch((error) =>
            captureTechnicalError(error, "clear_photo_cache"),
          );
          await clearMedicalNotifications();
          clearPrivateFiles();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
