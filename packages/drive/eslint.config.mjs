import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/eslint-config-proton/extraneousDependencies';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'react/prop-types': 'off',
            'react-hooks/exhaustive-deps': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-use-before-define': [
                'error',
                {
                    functions: false,
                    classes: false,
                },
            ],
            'no-console': [
                'warn',
                {
                    allow: ['warn', 'error'],
                },
            ],
            'max-classes-per-file': 'off',
            // TODO: Migrate same-package imports to relative paths and remove this rule
            'custom-rules/no-package-self-import': 'off',
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/*.sandboxed'],
                            allowTypeImports: true,
                            message:
                                'Sandboxed library files run only inside the sandbox. A value import pulls the library into the app bundle and runs it in our page — use `import type`.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['**/*.test.ts'],
        rules: {
            'max-classes-per-file': 'off',
            'class-methods-use-this': 'off',
        },
    },
    {
        // Sandboxed libraries check the runtime APIs they need themselves
        // (modules/sandbox/docs/adr/0001-rules-for-adding-a-library.md, decision 2), and the e2e harness runs
        // only in the browsers Playwright launches, so the browser-compat
        // baseline does not apply to either.
        files: ['**/*.sandboxed.ts', 'e2e/**/*.ts'],
        rules: {
            'compat/compat': 'off',
        },
    },
    {
        // `modules/sandbox/webpack/` runs only at build time, from an app's webpack config, so it may reach for devDependencies.
        files: ['modules/sandbox/webpack/**'],
        rules: {
            'import/no-extraneous-dependencies': createExtraneousDependenciesRule({
                devDependencies: [...extraneousDependenciesDevDependencies, '**/modules/sandbox/webpack/**'],
            }),
        },
    },
]);
