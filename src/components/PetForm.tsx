import { useNotice } from "@/providers/Notices";
import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Camera, Check } from "lucide-react-native";
import { useSettings } from "@/providers/Settings";
import { PetAvatar, Segments } from "./design";
import { FormLayout, DiscardChanges } from "./FormLayout";
import { router } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { Image } from "expo-image";
import { randomUUID } from "expo-crypto";
import type { PetSummary, UploadAsset } from "@/types/domain";
import { useSavePet } from "@/hooks/queries";
import { createPetFormSchema } from "@/utils/petForm";
import {
  approximateAgeParts,
  approximateBirthDate,
  validatePhoto,
} from "@/utils/pet";
import { pickPhoto } from "@/platform/files";
import { t } from "@/i18n";
import { Button, ErrorText, Field, T, useUnsavedChanges } from "./ui";
import { DateField } from "./DateField";
interface Values {
  name: string;
  species: "cat" | "dog";
  breed: string;
  sex: "unknown" | "male" | "female";
  birthMode: "unknown" | "exact" | "approximate";
  birthDate: string;
  ageYears: string;
  ageMonths: string;
  weightKg: string;
}
export function PetForm({ pet }: { pet: PetSummary }) {
  const { colors } = useSettings();
  const scroll = useRef<import("react-native").ScrollViewInstance>(null);
  const positions = useRef<Record<string, number>>({});
  const [discardAction, setDiscardAction] = useState<(() => void) | null>(null);
  const [picking, setPicking] = useState(false);
  const age = pet?.birthDate
    ? approximateAgeParts(pet.birthDate)
    : { years: 0, months: 0 };
  const form = useForm<Values>({
    defaultValues: {
      name: pet?.name ?? "",
      species: pet?.species ?? "cat",
      breed: pet?.breed ?? "",
      sex: pet?.sex ?? "unknown",
      birthMode: pet?.birthDate
        ? pet.birthDateApproximate
          ? "approximate"
          : "exact"
        : "unknown",
      birthDate: pet?.birthDate ?? "",
      ageYears: String(age.years),
      ageMonths: String(age.months),
      weightKg: pet?.latestWeightKg != null ? String(pet.latestWeightKg) : "",
    },
  });
  const values = useWatch({ control: form.control }) as Values;
  const notify = useNotice();
  const [photo, setPhoto] = useState<UploadAsset>();
  const [error, setError] = useState<unknown>();
  const [saved, setSaved] = useState<string>();
  const mutation = useSavePet();
  const busy = useRef(false);
  const requestId = useRef(randomUUID());
  const dirty = form.formState.isDirty || Boolean(photo);
  useUnsavedChanges(!saved && dirty, (discard) => {
    if (!busy.current) setDiscardAction(() => discard);
  });
  useEffect(() => {
    if (saved) router.replace(`/pets/${saved}`);
  }, [saved]);
  async function choosePhoto() {
    if (picking || busy.current) return;
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
  const save = () =>
    form.handleSubmit(async (data) => {
      if (busy.current) return;
      form.clearErrors();
      const parsed = createPetFormSchema().safeParse({
        ...data,
        ageYears: data.birthMode === "approximate" ? data.ageYears : "",
        ageMonths: data.birthMode === "approximate" ? data.ageMonths : "",
        weightKg: data.weightKg.replace(",", "."),
      });
      if (!parsed.success) {
        for (const issue of parsed.error.issues)
          form.setError(issue.path[0] as keyof Values, {
            message: issue.message,
          });
        const first = parsed.error.issues[0].path[0] as keyof Values;
        scroll.current?.scrollTo({
          y:
            positions.current[
              first === "ageYears" || first === "ageMonths"
                ? "birthDate"
                : first
            ] ?? 0,
          animated: true,
        });
        form.setFocus(first);
        return;
      }
      busy.current = true;
      setError(undefined);
      try {
        const v = parsed.data;
        const result = await mutation.mutateAsync({
          id: pet.id,
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
      } catch (e) {
        setError(e);
      } finally {
        busy.current = false;
      }
    })();
  const disabled = mutation.isPending || Boolean(saved);
  const track = (name: string, e: import("react-native").LayoutChangeEvent) => {
    positions.current[name] = e.nativeEvent.layout.y;
  };
  return (
    <>
      <FormLayout
        title={t("Редактировать питомца")}
        busy={disabled}
        scrollRef={scroll}
        footer={
          <Button
            title={
              mutation.isPending ? t("Сохраняем…") : t("Сохранить изменения")
            }
            disabled={disabled || picking || !dirty}
            icon={<Check size={20} color={colors.onAction} />}
            onPress={() => void save()}
          />
        }
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          {photo ? (
            <Image
              source={photo.uri}
              style={{ width: 64, height: 72, borderRadius: 18 }}
              contentFit="cover"
            />
          ) : (
            <PetAvatar pet={pet} size={64} height={72} />
          )}
          <View style={{ flex: 1 }}>
            <T style={{ fontFamily: "Manrope_700Bold" }}>
              {values.name || pet.name}
            </T>
            <Pressable
              accessibilityRole="button"
              disabled={disabled || picking}
              onPress={() => void choosePhoto()}
              style={{
                minHeight: 44,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Camera size={18} color={colors.muted} />
              <T style={{ fontSize: 12 }}>
                {picking
                  ? t("Загружаем фото…")
                  : pet.photoUrl || photo
                    ? t("Изменить фото")
                    : t("Добавить фото")}
              </T>
            </Pressable>
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <T
            style={{
              fontSize: 22,
              lineHeight: 30,
              fontFamily: "Manrope_800ExtraBold",
            }}
          >
            {t("Основные данные")}
          </T>
          <T style={{ color: colors.muted, fontSize: 12 }}>
            {t("Обязательно только имя. Остальное можно добавить позже.")}
          </T>
        </View>
        <View onLayout={(e) => track("name", e)}>
          <Field
            control={form.control}
            name="name"
            label={t("Имя *")}
            maxLength={80}
            editable={!disabled}
          />
        </View>
        <Segments
          filled
          label={t("Вид")}
          value={values.species}
          disabled={disabled}
          options={[
            { value: "cat", label: t("Кошка") },
            { value: "dog", label: t("Собака") },
          ]}
          onChange={(v) => form.setValue("species", v, { shouldDirty: true })}
        />
        <View onLayout={(e) => track("breed", e)}>
          <Field
            control={form.control}
            name="breed"
            label={t("Порода")}
            maxLength={100}
            editable={!disabled}
          />
        </View>
        <Segments
          filled
          label={t("Пол")}
          value={values.sex}
          disabled={disabled}
          options={[
            { value: "male", label: t("Мальчик") },
            { value: "female", label: t("Девочка") },
            { value: "unknown", label: t("Не знаю") },
          ]}
          onChange={(v) => form.setValue("sex", v, { shouldDirty: true })}
        />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <View style={{ gap: 8 }}>
          <T
            style={{
              fontSize: 22,
              lineHeight: 30,
              fontFamily: "Manrope_800ExtraBold",
            }}
          >
            {t("Возраст и вес")}
          </T>
          <T style={{ color: colors.muted, fontSize: 12 }}>
            {t("Укажите дату рождения или примерный возраст.")}
          </T>
        </View>
        <Segments
          filled
          label={t("Возраст")}
          value={values.birthMode}
          disabled={disabled}
          options={[
            { value: "exact", label: t("Дата рождения") },
            { value: "approximate", label: t("Примерный") },
            { value: "unknown", label: t("Не знаю") },
          ]}
          onChange={(v) => {
            form.clearErrors();
            form.setValue("birthMode", v, { shouldDirty: true });
          }}
        />
        <View onLayout={(e) => track("birthDate", e)}>
          {values.birthMode === "exact" ? (
            <>
              <DateField
                label={t("Дата рождения")}
                value={values.birthDate}
                maximumDate={new Date()}
                disabled={disabled}
                onChange={(v) =>
                  form.setValue("birthDate", v, { shouldDirty: true })
                }
              />
              {form.formState.errors.birthDate ? (
                <T accessibilityRole="alert" style={{ color: colors.danger }}>
                  {t("Дата рождения не может быть в будущем")}
                </T>
              ) : null}
            </>
          ) : values.birthMode === "approximate" ? (
            <View
              onLayout={(e) => track("ageYears", e)}
              style={{ flexDirection: "row", gap: 12 }}
            >
              <View style={{ flex: 1 }}>
                <Field
                  control={form.control}
                  name="ageYears"
                  label={t("Лет")}
                  keyboardType="number-pad"
                  editable={!disabled}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  control={form.control}
                  name="ageMonths"
                  label={t("Месяцев")}
                  keyboardType="number-pad"
                  editable={!disabled}
                />
              </View>
            </View>
          ) : (
            <T style={{ color: colors.muted, fontSize: 12 }}>
              {t(
                "Ничего страшного. Возраст можно будет указать в профиле питомца.",
              )}
            </T>
          )}
        </View>
        {values.birthMode === "approximate" ? (
          <T style={{ color: colors.muted, fontSize: 12 }}>
            {t("Возраст сохраним как приблизительный.")}
          </T>
        ) : null}
        <View onLayout={(e) => track("weightKg", e)}>
          <Field
            control={form.control}
            name="weightKg"
            label={t("Вес, кг")}
            keyboardType="decimal-pad"
            editable={!disabled}
          />
        </View>
        <T style={{ color: colors.muted, fontSize: 12 }}>
          {t("Можно оставить пустым и добавить позже.")}
        </T>
        <ErrorText error={error} />
      </FormLayout>
      <DiscardChanges
        action={discardAction}
        onClose={() => setDiscardAction(null)}
        description={t("Введённые данные и выбранное фото не сохранятся.")}
      />
    </>
  );
}
