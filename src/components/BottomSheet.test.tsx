import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { Text } from "react-native";
import { BottomSheet } from "./BottomSheet";
import GorhomBottomSheet from "@gorhom/bottom-sheet";

jest.mock("@/providers/Settings", () => ({
  useSettings: () => ({ colors: { background: "#fff", border: "#ddd" } }),
}));

it("syncs gesture dismissal with the owner and can reopen", async () => {
  const onClose = jest.fn();
  function Example() {
    const [visible, setVisible] = useState(true);
    return (
      <>
        <Text onPress={() => setVisible(true)}>Open</Text>
        <BottomSheet
          visible={visible}
          backdropColor="#0006"
          onRequestClose={() => {
            onClose();
            setVisible(false);
          }}
        >
          <Text>Sheet content</Text>
        </BottomSheet>
      </>
    );
  }
  await render(<Example />);
  // Gorhom owns gesture recognition; this exercises its completed-close event.
  await fireEvent(screen.getByText("Sheet content"), "close");
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Sheet content")).toBeNull();
  await fireEvent.press(screen.getByText("Open"));
  expect(screen.getByText("Sheet content")).toBeTruthy();
});

it("does not notify the owner again after a programmatic close", async () => {
  const onClose = jest.fn();
  const close = jest.spyOn(GorhomBottomSheet.prototype, "close");
  const { rerender } = await render(
    <BottomSheet visible backdropColor="#0006" onRequestClose={onClose}>
      <Text>Sheet content</Text>
    </BottomSheet>,
  );
  // Keep the native modal mounted until Gorhom completes its exit animation.
  await fireEvent(screen.getByTestId("bottom-sheet-modal"), "show");
  await rerender(
    <BottomSheet visible={false} backdropColor="#0006" onRequestClose={onClose}>
      <Text>Sheet content</Text>
    </BottomSheet>,
  );
  expect(close).toHaveBeenCalledTimes(1);
  await fireEvent(screen.getByText("Sheet content"), "close");
  expect(onClose).not.toHaveBeenCalled();
  close.mockRestore();
  expect(screen.queryByText("Sheet content")).toBeNull();
});
