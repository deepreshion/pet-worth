module.exports = {
  preset: "jest-expo",
  testMatch: ["**/*.test.[jt]s?(x)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^lucide-react-native$":
      "<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|expo-.*|@react-navigation/.*|@sentry/react-native|react-native-svg)/)",
  ],
};
