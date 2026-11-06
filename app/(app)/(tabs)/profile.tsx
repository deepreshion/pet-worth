import { useEffect, useState } from "react";
import { Alert, Linking } from "react-native";
import { useForm } from "react-hook-form";
import { useProfile, useSaveProfile } from "@/hooks/queries";
import { useAuth } from "@/providers/Auth";
import { useSettings } from "@/providers/Settings";
import {
  Button,
  Card,
  Choices,
  ErrorText,
  Field,
  Heading,
  QueryState,
  Screen,
  T,
  useUnsavedChanges,
} from "@/components/ui";
import { t } from "@/i18n";
function ProfileForm() {
  const profile = useProfile();
  const mutation = useSaveProfile();
  const auth = useAuth();
  const settings = useSettings();
  const [error, setError] = useState<unknown>();
  const form = useForm({ defaultValues: { displayName: "" } });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (profile.data && !form.formState.isDirty)
      form.reset({ displayName: profile.data.displayName ?? "" });
  }, [profile.data, form]);
  useUnsavedChanges(form.formState.isDirty && !busy);
  const save = form.handleSubmit(async (data) => {
    if (mutation.isPending) return;
    if (!data.displayName.trim() || data.displayName.trim().length > 100) {
      form.setError("displayName", { message: "NAME_REQUIRED" });
      return;
    }
    try {
      await mutation.mutateAsync(data);
      form.reset(data);
      Alert.alert(t("Настройки сохранены."));
    } catch (e) {
      setError(e);
    }
  });
  return (
    <Screen topSafe bottomSafe={false}>
      <Heading>{t("Пользователь")}</Heading>
      <Choices
        label={t("Язык")}
        value={settings.locale}
        options={[
          { value: "ru", label: "Русский" },
          { value: "en", label: "English" },
        ]}
        onChange={(v) => {
          void settings.setLocale(v).catch(setError);
        }}
      />
      <Choices
        label={t("Тема оформления")}
        value={settings.theme}
        options={[
          { value: "system", label: t("Системная") },
          { value: "light", label: t("Светлая") },
          { value: "dark", label: t("Тёмная") },
        ]}
        onChange={(v) => {
          void settings.setTheme(v).catch(setError);
        }}
      />
      <QueryState query={profile}>
        <Card>
          <T>{profile.data?.email}</T>
          <T>{profile.data?.timezone}</T>
          <Field
            control={form.control}
            name="displayName"
            label={t("Отображаемое имя")}
            maxLength={100}
          />
          <Button
            title={t("Сохранить")}
            disabled={mutation.isPending}
            onPress={() => {
              void save();
            }}
          />
        </Card>
      </QueryState>
      <ErrorText error={error} />
      <Button
        secondary
        title={t("Настройки уведомлений")}
        onPress={() => {
          void Linking.openSettings();
        }}
      />
      <Button
        secondary
        danger
        title={t("Выйти из аккаунта")}
        disabled={busy}
        onPress={() =>
          Alert.alert(t("Выйти из аккаунта"), undefined, [
            { text: t("Отмена"), style: "cancel" },
            {
              text: t("Выйти"),
              onPress: () => {
                setBusy(true);
                void auth
                  .signOut()
                  .catch(setError)
                  .finally(() => setBusy(false));
              },
            },
          ])
        }
      />
    </Screen>
  );
}
export default ProfileForm;
