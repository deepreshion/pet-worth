import { useLocalSearchParams } from "expo-router";
import { usePet, useProfile } from "@/hooks/queries";
import { MedicalEventForm } from "@/components/MedicalEventForm";
import { QueryState, T } from "@/components/ui";
import { t } from "@/i18n";
export default function CreateEvent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePet(id);
  const profile = useProfile();
  return (
    <>
      <QueryState query={pet}>
        <QueryState query={profile}>
          {pet.data?.canEdit && profile.data ? (
            <MedicalEventForm pet={pet.data} timezone={profile.data.timezone} />
          ) : (
            <T>{t("Нет доступа")}</T>
          )}
        </QueryState>
      </QueryState>
    </>
  );
}
