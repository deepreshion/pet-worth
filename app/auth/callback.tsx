import { useEffect, useRef, useState } from "react";
import { CatLoader } from "@/components/CatLoader";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/providers/Auth";
import { Button, ErrorText, Heading, Screen } from "@/components/ui";
import { t } from "@/i18n";
export default function Callback() {
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const auth = useAuth();
  const [error, setError] = useState<unknown>();
  const started = useRef(false);
  const invalid = Boolean(
    params.error || params.error_description || typeof params.code !== "string",
  );
  useEffect(() => {
    if (!auth.ready || started.current) return;
    started.current = true;
    if (
      params.error ||
      params.error_description ||
      typeof params.code !== "string"
    ) {
      return;
    }
    void auth
      .completeMagicLink(params.code)
      .then(() => router.replace("/"))
      .catch(() => setError("AUTH_CALLBACK"));
  }, [params.code, params.error, params.error_description, auth]);
  return (
    <Screen>
      <Heading>{t("Вход")}</Heading>
      {error || invalid ? (
        <>
          <ErrorText error={error ?? "AUTH_CALLBACK"} />
          <Button
            title={t("Назад")}
            onPress={() => router.replace(auth.session ? "/" : "/login")}
          />
        </>
      ) : (
        <CatLoader />
      )}
    </Screen>
  );
}
