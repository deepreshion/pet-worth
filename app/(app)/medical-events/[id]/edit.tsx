import { useLocalSearchParams } from "expo-router";
import { useEvent, usePet, useProfile } from "@/hooks/queries";
import { MedicalEventForm } from "@/components/MedicalEventForm";
import { QueryState, T } from "@/components/ui";
import { t } from "@/i18n";
export default function EditEvent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useEvent(id);
  return (
    <>
      <QueryState query={event}>
        {event.data?.canEdit ? (
          <Form eventId={id} petId={event.data.petId} />
        ) : (
          <T>{t("Нет доступа")}</T>
        )}
      </QueryState>
    </>
  );
}
function Form({ eventId, petId }: { eventId: string; petId: string }) {
  const event = useEvent(eventId);
  const pet = usePet(petId);
  const profile = useProfile();
  return (
    <QueryState query={pet}>
      <QueryState query={profile}>
        {pet.data && event.data && profile.data ? (
          <MedicalEventForm
            pet={pet.data}
            event={event.data}
            timezone={profile.data.timezone}
          />
        ) : null}
      </QueryState>
    </QueryState>
  );
}
