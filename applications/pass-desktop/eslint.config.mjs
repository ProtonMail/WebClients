import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelPaths } from '@proton/eslint-config-proton/barrel';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/eslint-config-proton/extraneousDependencies';
import { createRestrictedImportRule } from '@proton/eslint-config-proton/restrictedImports';

const restrictedImportOptions = { paths: createBarrelPaths() };

/**
 * lint-staged runs ESLint from the monorepo root with repo-relative file paths
 * (e.g. `applications/pass-desktop/src/lib/**`). Duplicate each package-local
 * glob so `import/no-extraneous-dependencies` still allows electron there.
 */
const withLintStagedPaths = (patterns) => patterns.flatMap((pattern) => [pattern, `**/pass-desktop/${pattern}`]);

/** Main-process sources import electron (devDependency required by Electron Forge). Renderer `src/app/**` is excluded. */
const passDesktopMainProcessDevDependencies = withLintStagedPaths([
    'src/main.ts',
    'src/preload.ts',
    'src/types.ts',
    'src/lib/**',
    'src/utils/platform.ts',
    'src/utils/squirrel.ts',
    'src/menu-view/**',
    'src/uninstallers/**',
]);

/** Build/config entry points that import devDependencies. */
const passDesktopDevDependencies = [
    ...extraneousDependenciesDevDependencies,
    ...passDesktopMainProcessDevDependencies,
    ...withLintStagedPaths([
        'forge.config.ts',
        'webpack.main.config.ts',
        'webpack.renderer.config.ts',
        'webpack.plugins.ts',
        'webpack.options.ts',
        'webpack.rules.ts',
        'electron-builder.config.js',
        'prettier.config.mjs',
    ]),
];

export default defineConfig([
    { ignores: ['native/target/**'] },
    defaultConfig,
    {
        rules: {
            'no-console': ['error', { allow: ['warn', 'error'] }],
            curly: ['error', 'multi-line'],
            'no-restricted-imports': createRestrictedImportRule(restrictedImportOptions),
        },
    },
    {
        files: ['**/*.tsx', '**/*.jsx'],
        rules: {
            'no-restricted-imports': createRestrictedImportRule({ ...restrictedImportOptions, tsx: true }),
        },
    },
    {
        name: 'pass-desktop-extraneous-dependencies',
        rules: {
            'import/no-extraneous-dependencies': createExtraneousDependenciesRule({
                devDependencies: passDesktopDevDependencies,
            }),
        },
    },
]);
