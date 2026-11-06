import { PetContentSkeleton } from "./PetDetailSkeleton";
import { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { PetPhoto } from "./PetPhoto";
import { router } from "expo-router";
import {
  ArrowLeft,
  CalendarPlus,
  Camera,
  Cat,
  Dog,
  FolderOpen,
  Mars,
  Pencil,
  Plus,
  Venus,
} from "lucide-react-native";
import type {
  MedicalEvent,
  MedicalEventType,
  PetSummary,
} from "@/types/domain";
import { useSettings } from "@/providers/Settings";
import { useUploadPetPhoto } from "@/hooks/queries";
import { pickPhoto } from "@/platform/files";
import { validatePhoto } from "@/utils/pet";
import { formatPetAge } from "@/presentation/pet";
import { fileCount } from "@/presentation/counts";
import {
  groupPetEvents,
  groupHistoryByMonth,
  petDocuments,
  type PetDocument,
} from "@/presentation/petDetail";
import { t } from "@/i18n";
import { Button, ErrorText, QueryState, Screen, T } from "./ui";
import { IconButton } from "./design";
import { EventRow } from "./EventRow";
import { AttachmentRow } from "./AttachmentRow";
import { CatLoader } from "./CatLoader";

type Row =
  | {
      key: string;
      kind:
        | "hero"
        | "header"
        | "details"
        | "filters"
        | "state"
        | "empty"
        | "documentsHeading";
    }
  | { key: string; kind: "heading" | "month"; title: string }
  | { key: string; kind: "event"; event: MedicalEvent; highlighted: boolean }
  | { key: string; kind: "document"; document: PetDocument };
type EventsQuery = {
  data?: MedicalEvent[];
  isPending: boolean;
  isError: boolean;
  refetch(): unknown;
};
export function PetDetailView({
  pet,
  events,
}: {
  pet: PetSummary;
  events: EventsQuery;
}) {
  const { colors } = useSettings();
  const [tab, setTab] = useState<"events" | "documents">("events");
  const [filter, setFilter] = useState<MedicalEventType | "">("");
  const [photoError, setPhotoError] = useState<unknown>();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const photoLock = useRef(false);
  const upload = useUploadPetPhoto();
  const list = useRef<FlatList<Row>>(null);
  const offset = useRef(0);
  const [scroll] = useState(() => new Animated.Value(0));
  const [navigationVisible, setNavigationVisible] = useState(false);
  const [listHeight, setListHeight] = useState(0);
  const [detailsHeight, setDetailsHeight] = useState(0);
  const [navigationHeight, setNavigationHeight] = useState(60);
  const all = events.data ?? [];
  const docs = petDocuments(all);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const { upcoming, history } = groupPetEvents(all, today, filter);
  const ready = !events.isPending && !events.isError;
  const footer = pet.canEdit && (tab === "events" || (ready && !docs.length));
  const rows: Row[] = [
    { key: "hero", kind: "hero" },
    { key: "header", kind: "header" },
    { key: "details", kind: "details" },
  ];
  if (!ready) rows.push({ key: "state", kind: "state" });
  else if (tab === "documents") {
    if (docs.length)
      rows.push(
        { key: "documentsHeading", kind: "documentsHeading" },
        ...docs.map((document) => ({
          key: document.id,
          kind: "document" as const,
          document,
        })),
      );
    else rows.push({ key: "empty", kind: "empty" });
  } else {
    if (all.length) rows.push({ key: "filters", kind: "filters" });
    if (!upcoming.length && !history.length)
      rows.push({ key: "empty", kind: "empty" });
    if (upcoming.length)
      rows.push(
        {
          key: "upcoming",
          kind: "heading",
          title: t("Предстоящие события"),
        },
        ...upcoming.map((event, i) => ({
          key: event.id,
          kind: "event" as const,
          event,
          highlighted: i === 0,
        })),
      );
    if (history.length)
      rows.push(
        { key: "history", kind: "heading", title: t("История") },
        ...groupHistoryByMonth(history).flatMap((group): Row[] => [
          { key: `month-${group.key}`, kind: "month", title: group.title },
          ...group.events.map((event) => ({
            key: event.id,
            kind: "event" as const,
            event,
            highlighted: false,
          })),
        ]),
      );
  }
  async function addPhoto() {
    if (photoLock.current || !pet.canEdit) return;
    photoLock.current = true;
    setPhotoBusy(true);
    setPhotoError(undefined);
    try {
      const photo = await pickPhoto();
      if (photo) {
        const issue = validatePhoto(photo);
        if (issue) throw new Error(issue);
        await upload.mutateAsync({
          petId: pet.id,
          familyId: pet.familyId,
          photo,
        });
      }
    } catch (error) {
      setPhotoError(error);
    } finally {
      photoLock.current = false;
      setPhotoBusy(false);
    }
  }
  function navigation() {
    return (
      <View style={s.navigation}>
        <IconButton
          label={t("Назад")}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/pets")
          }
        >
          <ArrowLeft size={22} color={colors.text} />
        </IconButton>
        <T style={{ flex: 1, textAlign: "center", fontSize: 12 }}>
          {t("Карточка питомца")}
        </T>
        {pet.canEdit ? (
          <IconButton
            label={t("Редактировать питомца")}
            onPress={() => router.push(`/pets/${pet.id}/edit`)}
          >
            <Pencil size={22} color={colors.text} />
          </IconButton>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>
    );
  }
  function renderRow({ item }: { item: Row }) {
    if (item.kind === "hero") {
      const Animal = pet.species === "dog" ? Dog : Cat;
      return (
        <Animated.View
          testID="pet-photo-hero"
          style={[
            s.hero,
            {
              backgroundColor: colors.soft,
              opacity: scroll.interpolate({
                inputRange: [231, 232],
                outputRange: [1, 0],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          {pet.photoUrl && failedPhoto !== pet.photoUrl ? (
            <PetPhoto
              pet={pet}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel={t("Фото питомца {name}", { name: pet.name })}
              onError={() => setFailedPhoto(pet.photoUrl)}
            />
          ) : (
            <View style={s.placeholder}>
              <Animal size={56} color={colors.muted} />
              {pet.canEdit ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("Добавить фото")}
                  accessibilityState={{ disabled: photoBusy }}
                  disabled={photoBusy}
                  onPress={() => void addPhoto()}
                  style={[s.photoButton, { backgroundColor: colors.surface }]}
                >
                  <Camera size={18} color={colors.text} />
                  <T style={{ fontSize: 12 }}>
                    {photoBusy ? t("Загрузка") : t("Добавить фото")}
                  </T>
                </Pressable>
              ) : null}
            </View>
          )}
          {photoBusy ? (
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colors.soft,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  paddingBottom: 28,
                },
              ]}
            >
              <CatLoader label={t("Загружаем фото…")} />
              <T style={{ fontSize: 14, fontFamily: "Manrope_600SemiBold" }}>
                {t("Загружаем фото…")}
              </T>
            </View>
          ) : null}
          <View
            style={s.heroNavigation}
            accessibilityElementsHidden={navigationVisible}
            importantForAccessibility={
              navigationVisible ? "no-hide-descendants" : "auto"
            }
          >
            <IconButton
              label={t("Назад")}
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/pets")
              }
            >
              <ArrowLeft size={22} color={colors.text} />
            </IconButton>
            {pet.canEdit ? (
              <IconButton
                label={t("Редактировать питомца")}
                onPress={() => router.push(`/pets/${pet.id}/edit`)}
              >
                <Pencil size={22} color={colors.text} />
              </IconButton>
            ) : null}
          </View>
        </Animated.View>
      );
    }
    if (item.kind === "header") {
      const Sex =
        pet.sex === "male" ? Mars : pet.sex === "female" ? Venus : null;
      return (
        <View
          testID="pet-detail-header"
          style={[s.header, { backgroundColor: colors.background }]}
        >
          <Animated.View
            accessibilityElementsHidden={!navigationVisible}
            importantForAccessibility={
              navigationVisible ? "auto" : "no-hide-descendants"
            }
            pointerEvents={navigationVisible ? "auto" : "none"}
            style={{
              height: scroll.interpolate({
                inputRange: [232 - navigationHeight, 232],
                outputRange: [0, navigationHeight],
                extrapolate: "clamp",
              }),
              opacity: scroll.interpolate({
                inputRange: [232 - navigationHeight, 232],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
              overflow: "hidden",
            }}
          >
            <View
              onLayout={(e) => setNavigationHeight(e.nativeEvent.layout.height)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                paddingBottom: 16,
              }}
            >
              {navigation()}
            </View>
          </Animated.View>
          <View style={{ gap: 5 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <T accessibilityRole="header" style={s.name}>
                {pet.name}
              </T>
              {Sex ? (
                <Sex
                  size={22}
                  color={colors.muted}
                  accessibilityLabel={t(
                    pet.sex === "male" ? "Мужской" : "Женский",
                  )}
                />
              ) : null}
            </View>
          </View>
        </View>
      );
    }
    if (item.kind === "details") {
      return (
        <View
          onLayout={(e) => setDetailsHeight(e.nativeEvent.layout.height)}
          style={[s.body, { backgroundColor: colors.background }]}
        >
          <View style={{ gap: 5, paddingTop: 5 }}>
            <T style={[s.meta, { color: colors.muted }]}>
              {pet.breed || t("Порода не указана")}
            </T>
            <T style={[s.meta, { color: colors.muted }]}>
              {formatPetAge(pet.birthDate, pet.birthDateApproximate) ||
                t("Возраст не указан")}{" "}
              ·{" "}
              {pet.latestWeightKg != null
                ? t("{weight} кг", { weight: pet.latestWeightKg })
                : t("Вес не указан")}
            </T>
          </View>
          <ErrorText error={photoError} />
          <View style={[s.tabs, { backgroundColor: colors.soft }]}>
            {(["events", "documents"] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === value }}
                onPress={() => {
                  setTab(value);
                  list.current?.scrollToOffset({
                    offset: offset.current >= 232 ? 232 : 0,
                    animated: false,
                  });
                }}
                style={[
                  s.tab,
                  {
                    backgroundColor:
                      tab === value ? colors.action : "transparent",
                  },
                ]}
              >
                <T
                  style={{
                    fontSize: 14,
                    fontFamily: "Manrope_700Bold",
                    color: tab === value ? colors.onAction : colors.text,
                  }}
                >
                  {t(value === "events" ? "События" : "Документы")}
                </T>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }
    let content;
    if (item.kind === "state")
      content = events.isPending ? (
        <PetContentSkeleton />
      ) : (
        <QueryState query={events}>{null}</QueryState>
      );
    if (item.kind === "filters")
      content = (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 5 }}
        >
          {(
            [
              ["", "Все"],
              ["vaccination", "Прививки"],
              ["vet_visit", "Врач"],
              ["analysis", "Анализы"],
              ["procedure", "Процедуры"],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              accessibilityRole="radio"
              accessibilityState={{ checked: filter === value }}
              onPress={() => setFilter(value)}
              style={[
                s.filter,
                {
                  backgroundColor:
                    filter === value ? colors.action : colors.surface,
                },
              ]}
            >
              <T
                style={{
                  fontSize: 12,
                  lineHeight: 16,
                  color: filter === value ? colors.onAction : colors.text,
                }}
              >
                {t(label)}
              </T>
            </Pressable>
          ))}
        </ScrollView>
      );
    if (item.kind === "month")
      content = (
        <T accessibilityRole="header" style={[s.meta, { color: colors.muted }]}>
          {item.title}
        </T>
      );
    if (item.kind === "heading")
      content = (
        <T
          accessibilityRole="header"
          style={[
            s.sectionTitle,
            item.key === "history" && { fontSize: 22, lineHeight: 31 },
          ]}
        >
          {item.title}
        </T>
      );
    if (item.kind === "event")
      content = (
        <EventRow
          event={item.event}
          variant={item.highlighted ? "featured" : "pet-list"}
        />
      );
    if (item.kind === "document")
      content = (
        <AttachmentRow
          attachment={item.document}
          compact
          eventTitle={item.document.eventTitle}
          eventDate={item.document.eventDate}
        />
      );
    if (item.kind === "documentsHeading")
      content = (
        <View style={s.navigation}>
          <T accessibilityRole="header" style={s.sectionTitle}>
            {t("Все документы")}
          </T>
          <T style={[s.meta, { color: colors.muted }]}>
            {fileCount(docs.length)}
          </T>
        </View>
      );
    if (item.kind === "empty") {
      const Icon = tab === "documents" ? FolderOpen : CalendarPlus;
      content = (
        <View style={s.empty}>
          <View style={[s.emptyIcon, { backgroundColor: colors.soft }]}>
            <Icon size={28} color={colors.text} />
          </View>
          <T style={[s.sectionTitle, { fontSize: 18, textAlign: "center" }]}>
            {t(
              tab === "documents"
                ? "Документов пока нет"
                : all.length
                  ? "Нет событий этого типа"
                  : "Пока что ничего нет",
            )}
          </T>
          {!(tab === "events" && all.length) ? (
            <T
              style={[
                s.meta,
                { color: colors.muted, textAlign: "center", lineHeight: 20 },
              ]}
            >
              {t(
                tab === "documents"
                  ? "Прикрепите файлы к событию — анализы и назначения появятся здесь."
                  : "Добавьте первый приём, прививку или анализ — всё сохранится в карточке.",
              )}
            </T>
          ) : null}
        </View>
      );
    }
    return (
      <View
        style={[
          s.body,
          item.key === rows[rows.length - 1].key
            ? {
                borderBottomLeftRadius: 32,
                borderBottomRightRadius: 32,
                paddingBottom: 24,
              }
            : null,
          { backgroundColor: colors.background },
          item.kind === "heading" ||
          item.kind === "documentsHeading" ||
          item.kind === "filters"
            ? { paddingTop: 20 }
            : null,
        ]}
      >
        {content}
      </View>
    );
  }
  return (
    <Screen
      topSafe
      backgroundColor={colors.soft}
      scroll={false}
      footer={
        footer ? (
          <Button
            title={t(
              ready && !all.length
                ? "Добавить первое событие"
                : "Добавить событие",
            )}
            icon={<Plus size={22} color={colors.onAction} />}
            onPress={() => router.push(`/pets/${pet.id}/medical-events/new`)}
          />
        ) : undefined
      }
    >
      <FlatList
        ref={list}
        testID="pet-detail-list"
        style={[s.viewport, { backgroundColor: colors.soft }]}
        data={rows}
        keyExtractor={(item) => item.key}
        renderItem={renderRow}
        stickyHeaderIndices={[1]}
        contentInsetAdjustmentBehavior="never"
        onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}
        contentContainerStyle={{
          paddingBottom: 24,
          minHeight: listHeight + 232 + detailsHeight,
        }}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.y;
          scroll.setValue(e.nativeEvent.contentOffset.y);
          const visible =
            e.nativeEvent.contentOffset.y > 232 - navigationHeight;
          if (visible !== navigationVisible) setNavigationVisible(visible);
        }}
        scrollEventThrottle={16}
      />
    </Screen>
  );
}
const s = StyleSheet.create({
  viewport: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 32,
    overflow: "hidden",
  },
  hero: {
    height: 260,
    borderRadius: 32,
    overflow: "hidden",
    marginBottom: -28,
  },
  placeholder: {
    height: 232,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  photoButton: {
    minHeight: 44,
    borderRadius: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroNavigation: {
    position: "absolute",
    left: 12,
    right: 12,
    top: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  header: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 0,
    gap: 0,
  },
  name: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 30,
    lineHeight: 41,
    flexShrink: 1,
  },
  meta: { fontSize: 13, lineHeight: 18 },
  tabs: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    marginTop: 20,
    minHeight: 52,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    padding: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filter: {
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 11,
    borderCurve: "continuous",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 16, paddingBottom: 10 },
  sectionTitle: { fontFamily: "Manrope_700Bold", fontSize: 17, lineHeight: 24 },
  empty: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
