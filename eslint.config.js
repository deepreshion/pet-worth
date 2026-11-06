const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");
module.exports = defineConfig([
  expo,
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "tests/**/*.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },

  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "dist-pages/**",
      ".expo/**",
      "ios/**",
      "android/**",
    ],
  },
]);
