import globals from "globals";
import { configs } from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";

export default defineConfig(
    js.configs.recommended,
    configs.eslintRecommended,
    configs.recommended,
    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.electron,
    importPlugin.flatConfigs.typescript,
    {
        languageOptions: {
            parserOptions: {
                // Required because lint-staged can invoke ESLint with files from multiple
                // sibling Electron apps in a single run; without this, `@typescript-eslint/parser`
                // can't disambiguate between candidate roots and fails with a parsing error.
                // See https://tseslint.com/parser-tsconfigrootdir
                tsconfigRootDir: import.meta.dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        settings: {
            "import/extensions": [".js", ".mjs", ".jsx", ".ts", ".tsx", ".d.ts"],
            "import/resolver": {
                typescript: {},
                node: {
                    extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts"],
                },
            },
        },
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "after-used",
                    argsIgnorePattern: "^_",
                    caughtErrors: "none",
                    destructuredArrayIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
        },
    },
    globalIgnores([".webpack"]),
);
