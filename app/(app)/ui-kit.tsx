import { Redirect } from "expo-router";
import { Button, Card, Heading, Screen, T } from "@/components/ui";
export default function UIKit() {
  if (!__DEV__) return <Redirect href="/" />;
  return (
    <Screen>
      <Heading>Pet Worth UI</Heading>
      <Card>
        <T>Manrope · Light / Dark</T>
        <Button title="Primary" onPress={() => undefined} />
        <Button secondary title="Secondary" onPress={() => undefined} />
        <Button title="Disabled" disabled onPress={() => undefined} />
      </Card>
    </Screen>
  );
}
