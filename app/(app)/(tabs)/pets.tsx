import { FlatList, View } from "react-native";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { usePets } from "@/hooks/queries";
import { useSettings } from "@/providers/Settings";
import {
  Button,
  Heading,
  QueryState,
  Screen,
  T,
  styles,
} from "@/components/ui";
import { PetCard } from "@/components/PetCard";
import { EmptyPets } from "@/components/EmptyPets";
import { petCount } from "@/presentation/counts";
import { t } from "@/i18n";
export default function Pets() {
  const query = usePets();
  const { colors } = useSettings();
  return (
    <Screen
      topSafe
      bottomSafe={false}
      scroll={false}
      footer={
        <Button
          title={t("Добавить питомца")}
          icon={<Plus size={21} color={colors.onAction} />}
          onPress={() => router.push("/pets/new")}
        />
      }
    >
      <QueryState query={query}>
        <FlatList
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={[styles.content, { gap: 14 }]}
          data={query.data ?? []}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PetCard pet={item} variant="list" />}
          ListHeaderComponent={
            <View style={{ gap: 4, marginBottom: 14 }}>
              <Heading>{t("Мои питомцы")}</Heading>
              <T style={{ color: colors.muted, fontSize: 12 }}>
                {query.data?.length
                  ? petCount(query.data.length)
                  : t("Начните с первого знакомства")}
              </T>
            </View>
          }
          ListEmptyComponent={<EmptyPets />}
        />
      </QueryState>
    </Screen>
  );
}
