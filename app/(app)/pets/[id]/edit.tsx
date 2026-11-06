import { useLocalSearchParams } from "expo-router";
import { usePet } from "@/hooks/queries";
import { PetForm } from "@/components/PetForm";
import { QueryState, T } from "@/components/ui";
import { t } from "@/i18n";
export default function EditPet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = usePet(id);
  return (
    <>
      <QueryState query={query}>
        {query.data?.canEdit ? (
          <PetForm key={id} pet={query.data} />
        ) : (
          <T>{t("Нет доступа")}</T>
        )}
      </QueryState>
    </>
  );
}
