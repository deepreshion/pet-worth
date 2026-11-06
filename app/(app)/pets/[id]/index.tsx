import { PetDetailSkeleton } from "@/components/PetDetailSkeleton";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { usePet, useEvents } from "@/hooks/queries";
import { QueryState, Screen } from "@/components/ui";
import { IconButton } from "@/components/design";
import { useSettings } from "@/providers/Settings";
import { t } from "@/i18n";
import { PetDetailView } from "@/components/PetDetailView";
export default function PetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useSettings();
  const pet = usePet(id);
  const events = useEvents(id);
  if (pet.isPending) return <PetDetailSkeleton />;
  if (pet.data && !pet.isError)
    return <PetDetailView key={id} pet={pet.data} events={events} />;
  return (
    <Screen topSafe backgroundColor={colors.soft}>
      <View style={{ alignItems: "flex-start" }}>
        <IconButton
          label={t("Назад")}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/pets")
          }
        >
          <ArrowLeft size={22} color={colors.text} />
        </IconButton>
      </View>
      <QueryState query={pet}>{null}</QueryState>
    </Screen>
  );
}
