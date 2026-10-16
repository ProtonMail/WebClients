import globals from "globals";
import { configs } from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { createNodeResolver, importX } from "eslint-plugin-import-x";

import noElectronStoreDirect from "./eslint-rules/no-electron-store-direct.mjs";

export default defineConfig(
    js.configs.recommended,
    configs.eslintRecommended,
    configs.recommended,
    importX.flatConfigs.recommended,
    importX.flatConfigs.electron,
    importX.flatConfigs.typescript,
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
            "import-x/extensions": [".js", ".mjs", ".jsx", ".ts", ".tsx", ".d.ts"],
            "import-x/resolver-next": [
                createTypeScriptImportResolver(),
                createNodeResolver({ extensions: [".js", ".jsx", ".ts", ".tsx", ".d.ts"] }),
            ],
        },
        plugins: {
            "inbox-desktop": {
                rules: {
                    "no-direct-electron-store-access": noElectronStoreDirect,
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
            "inbox-desktop/no-direct-electron-store-access": "error",
        },
    },
    globalIgnores([".webpack"]),
);
