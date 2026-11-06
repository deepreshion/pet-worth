import { Tabs } from "expo-router";
import { HomeIcon, ProfileIcon } from "@/components/NavigationIcons";
import { AppTabBar, AppTabButton, appTabStyles } from "@/components/AppTabBar";
import { PetCardsIcon } from "@/components/PetCardsIcon";
import { T } from "@/components/ui";
import { t } from "@/i18n";
import { useSettings } from "@/providers/Settings";
export default function TabsLayout() {
  const { colors } = useSettings();
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarActiveBackgroundColor: colors.soft,
        tabBarInactiveBackgroundColor: colors.surface,
        tabBarStyle: [
          appTabStyles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ],
        tabBarItemStyle: appTabStyles.item,
        tabBarIconStyle: appTabStyles.icon,
        tabBarButton: AppTabButton,
        tabBarLabel: ({ children, color, focused }) => (
          <T
            style={[
              appTabStyles.label,
              {
                color,
                fontFamily: focused
                  ? "Manrope_600SemiBold"
                  : "Manrope_400Regular",
              },
            ]}
          >
            {children}
          </T>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("Главная"),
          tabBarIcon: ({ color }) => <HomeIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{
          title: t("Питомцы"),
          tabBarIcon: ({ color }) => <PetCardsIcon size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("Профиль"),
          tabBarIcon: ({ color }) => <ProfileIcon size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
