import { useState } from "react";
import { SectionList, Pressable, View } from "react-native";
import { router } from "expo-router";
import {
  CalendarCheck,
  ChevronDown,
  Plus,
} from "lucide-react-native";
import { usePets, useEvents } from "@/hooks/queries";
import { useSettings } from "@/providers/Settings";
import { Button, QueryState, Screen, T } from "@/components/ui";
import { PetCard } from "@/components/PetCard";
import { PetPicker } from "@/components/PetPicker";
import { PetCardsIcon } from "@/components/PetCardsIcon";
import { EventRow } from "@/components/EventRow";
import { EventCalendar } from "@/components/EventCalendar";
import { EmptyPets } from "@/components/EmptyPets";
import { design } from "@/components/design";
import {
  eventsForPet,
  upcomingEvents,
  visiblePetEvents,
} from "@/utils/eventPresentation";
import { localDateString } from "@/utils/medicalEvents";
import { eventCount, petCount } from "@/presentation/counts";
import { formatEventDayHeading } from "@/presentation/medicalEvents";
import { t } from "@/i18n";

export default function Home() {
  const { colors } = useSettings();
  const pets = usePets();
  const events = useEvents();
  const [selected, setSelected] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [picker, setPicker] = useState<"select" | "add" | null>(null);
  const all = selected === "all" && (pets.data?.length ?? 0) > 1;
  const pet = pets.data?.find((p) => p.id === selected) ?? pets.data?.[0];
  const petEvents = all
    ? (events.data ?? []).filter((e) =>
        pets.data?.some((p) => p.id === e.petId),
      )
    : eventsForPet(events.data ?? [], pet?.id);
  const upcoming = upcomingEvents(petEvents, localDateString(), Infinity);
  const visible = date
    ? visiblePetEvents(petEvents, date, localDateString())
    : upcoming;
  const sections: { date: string; data: typeof visible }[] = [];
  for (const event of visible) {
    const last = sections[sections.length - 1];
    if (last?.date === event.eventDate) last.data.push(event);
    else sections.push({ date: event.eventDate, data: [event] });
  }
  const add = () => {
    if (!all && pet?.canEdit) router.push(`/pets/${pet.id}/medical-events/new`);
    else setPicker("add");
  };
  return (
    <Screen topSafe bottomSafe={false} scroll={false}>
      <QueryState query={pets}>
        <SectionList
          contentInsetAdjustmentBehavior="never"
          sections={!pet || events.isError || events.isPending ? [] : sections}
          stickySectionHeadersEnabled={false}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 4,
            paddingBottom: 24,
            gap: 8,
          }}
          renderItem={({ item }) => (
            <EventRow event={item} variant="home-list" showPet={all} />
          )}
          renderSectionHeader={({ section }) =>
            date ? null : (
              <T
                accessibilityRole="header"
                style={{
                  paddingTop: 4,
                  marginBottom: -4,
                  fontSize: 16,
                  lineHeight: 24,
                  fontFamily: "Manrope_800ExtraBold",
                }}
              >
                {formatEventDayHeading(section.date)}
              </T>
            )
          }
          ListHeaderComponent={
            <View style={{ gap: 12 }}>
              {!pet ? (
                <>
                  <EmptyPets />
                  <Button
                    title={t("Добавить питомца")}
                    icon={<Plus size={20} color={colors.onAction} />}
                    onPress={() => router.push("/pets/new")}
                  />
                </>
              ) : (
                <>
                  {all ? (
                    <View
                      style={{
                        padding: 12,
                        borderRadius: 24,
                        backgroundColor: colors.card,
                        gap: 8,
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("Выбрать питомца")}
                        onPress={() => setPicker("select")}
                        style={{
                          minHeight: 44,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <PetCardsIcon size={24} color={colors.text} />
                        <T
                          style={{
                            flex: 1,
                            fontSize: 22,
                            lineHeight: 30,
                            fontFamily: "Manrope_800ExtraBold",
                          }}
                        >
                          {t("Все питомцы")}
                        </T>
                        <ChevronDown size={18} color={colors.text} />
                      </Pressable>
                      <T style={{ color: colors.muted, fontSize: 12 }}>
                        {petCount(pets.data?.length ?? 0)}
                        {!events.isPending && !events.isError
                          ? ` · ${eventCount(upcoming.length)}`
                          : ""}
                      </T>
                      {pets.data?.some((p) => p.canEdit) ? (
                        <Button
                          compact
                          style={{ minHeight: 44, borderRadius: 14 }}
                          title={t("Добавить событие")}
                          icon={<Plus size={16} color={colors.onAction} />}
                          onPress={add}
                        />
                      ) : null}
                    </View>
                  ) : (
                    <PetCard
                      pet={pet}
                      onChoose={
                        (pets.data?.length ?? 0) > 1
                          ? () => setPicker("select")
                          : undefined
                      }
                    />
                  )}
                  <QueryState query={events}>
                    {upcoming[0] ? (
                      <EventRow
                        event={upcoming[0]}
                        variant="featured"
                        relative
                        showPet={all}
                      />
                    ) : (
                      <T style={{ padding: 14, color: colors.muted }}>
                        {t("Ближайших событий пока нет.")}
                      </T>
                    )}
                    <View style={{ gap: 8 }}>
                      <EventCalendar
                        events={petEvents}
                        selected={date}
                        onSelect={setDate}
                      />
                      <View style={[design.row, { minHeight: 44, gap: 8 }]}>
                        <T
                          accessibilityRole="header"
                          style={{
                            flex: 1,
                            fontFamily: "Manrope_800ExtraBold",
                            fontSize: date ? 16 : 17,
                            lineHeight: 24,
                          }}
                        >
                          {date
                            ? formatEventDayHeading(date)
                            : t("Ближайшие события")}
                        </T>
                        {date ? (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => setDate(null)}
                            style={({ pressed }) => ({
                              minWidth: 98,
                              minHeight: 44,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              borderRadius: 14,
                              backgroundColor: colors.soft,
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: pressed ? 0.7 : 1,
                            })}
                          >
                            <T
                              style={{
                                fontSize: 12,
                                fontFamily: "Manrope_700Bold",
                              }}
                            >
                              {t("Ближайшие")}
                            </T>
                          </Pressable>
                        ) : (
                          <T style={{ fontSize: 12, color: colors.muted }}>
                            {eventCount(visible.length)}
                          </T>
                        )}
                      </View>
                      {!visible.length ? (
                        date ? (
                          <View
                            accessibilityLiveRegion="polite"
                            style={{
                              alignItems: "center",
                              paddingVertical: 24,
                              gap: 12,
                            }}
                          >
                            <CalendarCheck size={28} color={colors.text} />
                            <T
                              style={{
                                fontSize: 17,
                                lineHeight: 25,
                                fontFamily: "Manrope_700Bold",
                                textAlign: "center",
                              }}
                            >
                              {t("На этот день событий нет")}
                            </T>
                          </View>
                        ) : (
                          <T
                            style={{
                              padding: 16,
                              color: colors.muted,
                              backgroundColor: colors.surface,
                              borderRadius: 20,
                            }}
                          >
                            {t("Ближайших событий пока нет.")}
                          </T>
                        )
                      ) : null}
                    </View>
                  </QueryState>
                </>
              )}
            </View>
          }
        />
      </QueryState>
      <PetPicker
        visible={picker !== null}
        pets={pets.data ?? []}
        selected={all ? "all" : (pet?.id ?? "")}
        adding={picker === "add"}
        onClose={() => setPicker(null)}
        onSelect={(id) => {
          if (picker === "add") {
            if (pets.data?.some((p) => p.id === id && p.canEdit))
              router.push(`/pets/${id}/medical-events/new`);
          } else {
            setSelected(id);
            setDate(null);
          }
          setPicker(null);
        }}
      />
    </Screen>
  );
}
