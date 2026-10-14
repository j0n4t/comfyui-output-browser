import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["web/**/*.js", "tests/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": "warn",
      "no-debugger": "warn",
      "no-var": "warn",
      "prefer-const": "warn",
      "no-await-in-loop": "warn",
    },
  },
  { ignores: ["node_modules/**", "dist/**", "__pycache__/**", ".git/**"] },
];
