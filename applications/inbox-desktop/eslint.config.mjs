import { globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
    js.configs.recommended,
    tseslint.configs.eslintRecommended,
    tseslint.configs.recommended,
    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.electron,
    importPlugin.flatConfigs.typescript,
    {
        languageOptions: {
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
