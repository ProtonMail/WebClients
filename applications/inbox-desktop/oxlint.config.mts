import { defineConfig } from "oxlint";

import { createOxlintConfig } from "@proton/oxlint-config/createOxlintConfig";
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from "@proton/oxlint-config/extraneousDependencies";
import { allGlobs } from "@proton/oxlint-config/globs";

/**
 * lint-staged runs the linter from the monorepo root with repo-relative file paths
 * (e.g. `applications/inbox-desktop/src/ipc/**`). Duplicate each package-local
 * glob so `proton/no-extraneous-dependencies` still allows electron there.
 */
const withLintStagedPaths = (patterns: string[]) =>
    patterns.flatMap((pattern) => [pattern, `**/inbox-desktop/${pattern}`]);

/**
 * Nearly all of src/ is Electron main-process code that imports electron (a devDependency required by Electron Forge),
 * so the list is deliberately broad; only files that do not import it (e.g. type declarations) are left out.
 */
const inboxDesktopMainProcessDevDependencies = withLintStagedPaths([
    "src/index.ts",
    "src/preload.ts",
    "src/renderer.ts",
    "src/constants*",
    "src/constants/**",
    "src/ipc/**",
    "src/store/**",
    "src/utils/**",
    "src/update/**",
    "src/windows/**",
    "src/macos/**",
    "src/debug/**",
    "src/__mocks__/**",
    "jest.*.ts",
]);

/** Build/config entry points that import devDependencies. */
const inboxDesktopDevDependencies = [
    ...extraneousDependenciesDevDependencies,
    ...inboxDesktopMainProcessDevDependencies,
    ...withLintStagedPaths(["forge.config.ts", "webpack.*.ts", "jest.config.ts", "jest.setup.ts", "tasks/**"]),
];

const config = createOxlintConfig({
    preset: "base",
    ignorePatterns: [".webpack/**"],
    overrides: [
        {
            files: allGlobs,
            rules: {
                "proton/no-extraneous-dependencies": createExtraneousDependenciesRule({
                    devDependencies: inboxDesktopDevDependencies,
                }),
                "inbox-desktop/no-direct-electron-store-access": "error",
            },
        },
        {
            // The shared config enables rules the previous ESLint setup (js, typescript-eslint and import-x
            // recommended) did not have: they are off here to keep the rule set equivalent.
            files: allGlobs,
            rules: {
                "custom-rules/no-boolean-entitlement-composition": "off",
                "custom-rules/no-package-self-import": "off",
                "custom-rules/no-single-entitlement-condition": "off",
                "import/no-cycle": "off",
                "no-console": "off",
                "no-duplicate-imports": "off",
                "no-empty-function": "off",
                "no-loop-func": "off",
                "no-nested-ternary": "off",
                "no-restricted-properties": "off",
                "no-use-before-define": "off",
                "no-useless-constructor": "off",
                "no-void": "off",
                curly: "off",
                "compat/compat": "off",
                "proton/enforce-uint8array-arraybuffer": "off",
                "proton/naming-convention": "off",
                "proton/restricted-imports": "off",
                "proton/restricted-syntax": "off",
                "typescript/array-type": "off",
                "typescript/consistent-type-imports": "off",
                "typescript/dot-notation": "off",
                "typescript/no-floating-promises": "off",
                "typescript/no-for-in-array": "off",
                "typescript/no-implied-eval": "off",
                "typescript/no-import-type-side-effects": "off",
                "typescript/no-misused-promises": "off",
                "typescript/prefer-enum-initializers": "off",
                "typescript/return-await": "off",
            },
        },
        {
            // Oxlint equivalents of the recommended rules the previous ESLint setup enforced. The shared config
            // turns the `correctness` category off, so they are listed one by one.
            files: allGlobs,
            rules: {
                "no-case-declarations": "error",
                "no-cond-assign": "error",
                "no-constant-condition": "error",
                "no-dupe-else-if": "error",
                "no-dupe-keys": "error",
                "no-empty": "error",
                "no-empty-pattern": "error",
                "no-ex-assign": "error",
                "no-extra-boolean-cast": "error",
                "no-unreachable": "error",
                "no-unsafe-finally": "error",
                "no-useless-escape": "error",
                "typescript/ban-ts-comment": "error",
                "typescript/no-explicit-any": "error",
                "typescript/no-empty-object-type": "error",
                "typescript/no-require-imports": "error",
                "typescript/no-unsafe-function-type": "error",
                "typescript/no-wrapper-object-types": "error",
                "import/named": "error",
                "import/export": "error",
                "import/no-duplicates": "warn",
            },
        },
    ],
});

export default defineConfig({
    ...config,
    // Keep the plugins already set by createOxlintConfig (e.g. the optional local overlay)
    jsPlugins: [...(config.jsPlugins ?? []), { name: "inbox-desktop", specifier: "./oxlint-plugin.mjs" }],
});
