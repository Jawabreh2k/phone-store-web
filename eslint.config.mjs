import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const staffOnlyImportPatterns = {
  patterns: [
    {
      group: [
        "@/features/admin/*",
        "@/lib/admin-*",
        "@/lib/use-admin-action",
        "@/lib/api/admin-client",
      ],
      message:
        "Storefront code must not pull in staff-only code or its client bundles.",
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/features/admin/**",
      // [lang] is a real folder name; a bare [lang] glob is a character class.
      "src/app/**/admin/**",
      // Staff modules import each other. lib/ does not move in this refactor.
      "src/lib/admin-*.ts",
      "src/lib/use-admin-action.ts",
      "src/lib/api/admin-client.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", staffOnlyImportPatterns],
    },
  },
  {
    files: ["src/features/admin/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/storefront/*"],
              message:
                "Admin features must not import storefront features. Shared pieces belong in components/.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
