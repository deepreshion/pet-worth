jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("expo-crypto", () => ({
  randomUUID: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
}));
jest.mock("@gorhom/bottom-sheet", () => ({
  __esModule: true,
  ...require("@gorhom/bottom-sheet/mock"),
}));
jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: require("react-native").View,
  NativeViewGestureHandler: require("react-native").View,
}));
