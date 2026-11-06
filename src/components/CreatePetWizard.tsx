import { BottomSheet } from "./BottomSheet";
import { useNotice } from "@/providers/Notices";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { randomUUID } from "expo-crypto";
import {
  ArrowRight,
  Camera,
  Cat,
  ChevronLeft,
  Dog,
  Trash2,
  X,
} from "lucide-react-native";
import { useSavePet } from "@/hooks/queries";
import { useSettings } from "@/providers/Settings";
import { createPetFormSchema } from "@/utils/petForm";
import { approximateBirthDate, validatePhoto } from "@/utils/pet";
import { formatPetAge } from "@/presentation/pet";
import { pickPhoto } from "@/platform/files";
import type { UploadAsset } from "@/types/domain";
import { t } from "@/i18n";
import { Button, ErrorText, Field, Screen, T, useUnsavedChanges } from "./ui";
import { DateField } from "./DateField";
import { design, IconButton, Segments } from "./design";
interface Values {
  name: string;
  species: "cat" | "dog";
  breed: string;
  sex: "male" | "female" | "unknown";
  birthMode: "unknown" | "exact" | "approximate";
  birthDate: string;
  ageYears: string;
  ageMonths: string;
  weightKg: string;
}
export function CreatePetWizard() {
  const { colors } = useSettings();
  const form = useForm<Values>({
    defaultValues: {
      name: "",
      species: "cat",
      breed: "",
      sex: "unknown",
      birthMode: "unknown",
      birthDate: "",
      ageYears: "",
      ageMonths: "",
      weightKg: "",
    },
  });
  const values = useWatch({ control: form.control }) as Values;
  const notify = useNotice();
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<UploadAsset>();
  const [error, setError] = useState<unknown>();
  const [saveFailed, setSaveFailed] = useState(false);
  const [saved, setSaved] = useState<string>();
  const [picking, setPicking] = useState(false);
  const mutation = useSavePet();
  const locked = useRef(false);
  const requestId = useRef(randomUUID());
  const [discardAction, setDiscardAction] = useState<(() => void) | null>(null);
  useUnsavedChanges(
    !saved && (form.formState.isDirty || Boolean(photo)),
    (discard) => setDiscardAction(() => discard),
  );
  useEffect(() => {
    if (saved) router.replace(`/pets/${saved}`);
  }, [saved]);
  const set = (key: keyof Values, value: Values[keyof Values]) =>
    form.setValue(key, value, { shouldDirty: true });
  async function choosePhoto() {
    if (picking || locked.current) return;
    setPicking(true);
    setError(undefined);
    try {
      const picked = await pickPhoto();
      if (picked) {
        const issue = validatePhoto(picked);
        if (issue) throw new Error(issue);
        setPhoto(picked);
      }
    } catch (e) {
      setError(e);
    } finally {
      setPicking(false);
    }
  }
  function next() {
    form.clearErrors();
    setError(undefined);
    setSaveFailed(false);
    const result = createPetFormSchema().shape.name.safeParse(values.name);
    if (!result.success) {
      form.setError("name", { message: result.error.issues[0].message });
      return;
    }
    setStep((s) => s + 1);
  }
  async function save() {
    if (locked.current) return;
    form.clearErrors();
    setError(undefined);
    setSaveFailed(false);
    const parsed = createPetFormSchema().safeParse({
      ...values,
      weightKg: values.weightKg.replace(",", "."),
    });
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        form.setError(issue.path[0] as keyof Values, {
          message: issue.message,
        });
      const field = String(parsed.error.issues[0].path[0]);
      setStep(
        ["name", "species"].includes(field)
          ? 1
          : ["breed", "sex"].includes(field)
            ? 2
            : 3,
      );
      setError(parsed.error.issues[0].message);
      return;
    }
    locked.current = true;
    try {
      const v = parsed.data;
      const result = await mutation.mutateAsync({
        requestId: requestId.current,
        name: v.name,
        species: v.species,
        breed: v.breed,
        sex: v.sex,
        birthDate:
          v.birthMode === "exact"
            ? v.birthDate
            : v.birthMode === "approximate"
              ? approximateBirthDate(v.ageYears ?? 0, v.ageMonths ?? 0)
              : undefined,
        birthDateApproximate: v.birthMode === "approximate",
        weightKg: v.weightKg,
        photo,
      });
      if (result.photoUploadFailed)
        notify?.(`${t("Фото не загрузилось")}
${t("Данные питомца сохранены. Попробуйте добавить фото в редактировании.")}`);
      setSaved(result.petId);
    } catch {
      setSaveFailed(true);
    } finally {
      locked.current = false;
    }
  }
  const busy = mutation.isPending;
  return (
    <>
      <Screen
        topSafe
        footer={
          <Button
            title={
              busy
                ? t("Сохраняем…")
                : step === 3
                  ? t("Добавить питомца")
                  : t("Далее")
            }
            disabled={busy || picking || Boolean(saved)}
            icon={<ArrowRight size={21} color={colors.onAction} />}
            onPress={() => {
              if (step === 3) void save();
              else next();
            }}
          />
        }
      >
        <View style={design.row}>
          <IconButton
            label={t("Назад")}
            disabled={busy}
            onPress={() => {
              if (step > 1) {
                setStep(step - 1);
                setError(undefined);
              } else router.back();
            }}
          >
            <ChevronLeft color={colors.text} size={20} />
          </IconButton>
          <T
            style={{
              fontFamily: "Manrope_700Bold",
              fontSize: 16,
              flex: 1,
              textAlign: "center",
            }}
          >
            {t("Новый питомец")}
          </T>
          <IconButton
            label={t("Закрыть")}
            disabled={busy}
            onPress={() => router.back()}
          >
            <X size={20} color={colors.muted} />
          </IconButton>
        </View>
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: i <= step ? colors.text : colors.border,
                }}
              />
            ))}
          </View>
          <T style={{ color: colors.muted, fontSize: 11 }}>
            {t("Шаг {step} из 3", { step })}
          </T>
        </View>
        <View style={{ gap: 10 }}>
          <T
            accessibilityRole="header"
            style={{ ...design.title, fontSize: 28, lineHeight: 35 }}
          >
            {step === 1
              ? t("Знакомство")
              : step === 2
                ? t("Порода и пол")
                : t("Возраст и вес")}
          </T>
          <T style={{ color: colors.muted }}>
            {step === 1
              ? t("Расскажите, кто появился в вашей семье.")
              : step === 2
                ? t("Эти данные можно заполнить позже.")
                : t(
                    "Помогут точнее вести историю здоровья. Если не знаете — заполните позже.",
                  )}
          </T>
        </View>
        {step === 1 ? (
          <>
            <Segments
              label={t("Вид питомца")}
              value={values.species}
              disabled={busy}
              options={[
                {
                  value: "cat",
                  label: t("Кошка"),
                  icon: <Cat size={24} color={colors.text} strokeWidth={1.5} />,
                },
                {
                  value: "dog",
                  label: t("Собака"),
                  icon: <Dog size={24} color={colors.text} strokeWidth={1.5} />,
                },
              ]}
              onChange={(v) => set("species", v)}
            />
            <Field
              control={form.control}
              name="name"
              label={t("Имя питомца")}
              placeholder={t("Например, Сеня")}
              maxLength={80}
              editable={!busy}
            />
            <View style={{ gap: 9 }}>
              {photo ? (
                <T style={{ fontFamily: "Manrope_700Bold", fontSize: 13 }}>
                  {t("Фото")}
                </T>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  gap: photo ? 14 : 16,
                  alignItems: "center",
                  justifyContent: photo ? "space-between" : undefined,
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("Выбрать из галереи")}
                  disabled={picking || busy}
                  onPress={() => void choosePhoto()}
                  style={{
                    width: photo ? 96 : 100,
                    height: photo ? 120 : 112,
                    borderTopLeftRadius: 30,
                    borderTopRightRadius: 16,
                    borderBottomRightRadius: 30,
                    borderBottomLeftRadius: 16,
                    borderWidth: photo ? 1 : 0,
                    borderColor: colors.border,
                    overflow: "hidden",
                    backgroundColor: colors.soft,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {photo ? (
                    <Image
                      source={photo.uri}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      accessibilityLabel={t("Фотография питомца")}
                    />
                  ) : (
                    <Camera color={colors.text} size={26} strokeWidth={1.5} />
                  )}
                </Pressable>
                {!photo ? (
                  <View style={{ flex: 1, gap: 5 }}>
                    <T
                      style={{
                        fontFamily: "Manrope_700Bold",
                        fontSize: 14,
                      }}
                    >
                      {t("Добавить фото")}
                    </T>
                    {!photo ? (
                      <>
                        <T style={{ color: colors.muted, fontSize: 12 }}>
                          {t("Необязательно. Можно добавить позже.")}
                        </T>
                        <Pressable
                          accessibilityRole="button"
                          disabled={picking || busy}
                          onPress={() => void choosePhoto()}
                          style={{ minHeight: 44, justifyContent: "center" }}
                        >
                          <T
                            style={{
                              fontSize: 12,
                              fontFamily: "Manrope_700Bold",
                            }}
                          >
                            {t("Выбрать из галереи")}
                          </T>
                        </Pressable>
                      </>
                    ) : null}
                  </View>
                ) : null}
                {photo ? (
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("Заменить")}
                      accessibilityState={{ disabled: picking || busy }}
                      disabled={picking || busy}
                      onPress={() => void choosePhoto()}
                      style={({ pressed }) => [
                        styles.photoAction,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          opacity: picking || busy ? 0.4 : pressed ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Camera size={20} color={colors.text} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("Удалить")}
                      accessibilityState={{ disabled: picking || busy }}
                      disabled={picking || busy}
                      onPress={() => setPhoto(undefined)}
                      style={({ pressed }) => [
                        styles.photoAction,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          opacity: picking || busy ? 0.4 : pressed ? 0.6 : 1,
                        },
                      ]}
                    >
                      <Trash2 size={20} color={colors.danger} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                padding: 14,
                borderRadius: 16,
                backgroundColor: colors.soft,
              }}
            >
              {values.species === "cat" ? (
                <Cat size={20} color={colors.text} />
              ) : (
                <Dog size={20} color={colors.text} />
              )}
              <T style={{ flexShrink: 1 }}>
                {values.name} ·{" "}
                {values.species === "cat" ? t("Кошка") : t("Собака")}
              </T>
            </View>
            <Field
              control={form.control}
              name="breed"
              label={t("Порода")}
              placeholder={t("Например, золотистый ретривер")}
              maxLength={100}
              editable={!busy}
            />
            <T style={{ color: colors.muted, fontSize: 12 }}>
              {t("Если порода неизвестна, оставьте поле пустым.")}
            </T>
            <Segments
              label={t("Пол")}
              value={values.sex}
              disabled={busy}
              options={[
                { value: "male", label: t("Мальчик") },
                { value: "female", label: t("Девочка") },
                { value: "unknown", label: t("Не знаю") },
              ]}
              onChange={(v) => set("sex", v)}
            />
          </>
        ) : null}
        {step === 3 ? (
          <>
            <Segments
              label={t("Возраст")}
              filled
              value={values.birthMode}
              disabled={busy}
              options={[
                { value: "exact", label: t("Дата рождения") },
                { value: "approximate", label: t("Примерный") },
                { value: "unknown", label: t("Не знаю") },
              ]}
              onChange={(v) => set("birthMode", v)}
            />
            {values.birthMode === "exact" ? (
              <>
                <DateField
                  label={t("Дата рождения")}
                  value={values.birthDate}
                  maximumDate={new Date()}
                  disabled={busy}
                  onChange={(v) => set("birthDate", v)}
                />
                {values.birthDate ? (
                  <T style={{ color: colors.muted, fontSize: 12 }}>
                    {formatPetAge(values.birthDate, false)}
                  </T>
                ) : null}
              </>
            ) : values.birthMode === "approximate" ? (
              <>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Field
                      control={form.control}
                      name="ageYears"
                      label={t("Лет")}
                      keyboardType="number-pad"
                      editable={!busy}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      control={form.control}
                      name="ageMonths"
                      label={t("Месяцев")}
                      keyboardType="number-pad"
                      editable={!busy}
                    />
                  </View>
                </View>
                <T style={{ color: colors.muted, fontSize: 12 }}>
                  {t("Возраст сохраним как приблизительный.")}
                </T>
              </>
            ) : (
              <T style={{ color: colors.muted }}>
                {t(
                  "Ничего страшного. Возраст можно будет указать в профиле питомца.",
                )}
              </T>
            )}
            <Field
              control={form.control}
              name="weightKg"
              label={`${t("Вес")}, ${t("кг")}`}
              keyboardType="decimal-pad"
              editable={!busy}
            />
            <T style={{ color: colors.muted, fontSize: 12 }}>
              {t("Можно оставить пустым и взвесить позже.")}
            </T>
          </>
        ) : null}
        <ErrorText error={error} />
        <ErrorText error={saveFailed ? "PET_SAVE_FAILED" : undefined} />
      </Screen>
      <BottomSheet
        visible={Boolean(discardAction)}
        backdropColor="#0006"
        onRequestClose={() => setDiscardAction(null)}
      >
        <View
          accessibilityViewIsModal
          style={{
            padding: 24,
            paddingBottom: 40,
            gap: 16,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: colors.background,
          }}
        >
          <T
            accessibilityRole="header"
            style={{
              fontSize: 23,
              lineHeight: 30,
              fontFamily: "Manrope_800ExtraBold",
            }}
          >
            {t("Выйти без сохранения?")}
          </T>
          <T style={{ color: colors.muted }}>
            {t("Введённые данные и выбранное фото не сохранятся.")}
          </T>
          <Button
            title={t("Продолжить заполнение")}
            onPress={() => setDiscardAction(null)}
          />
          <Button
            secondary
            danger
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            title={t("Выйти без сохранения")}
            onPress={() => {
              const discard = discardAction;
              setDiscardAction(null);
              discard?.();
            }}
          />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  photoAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
