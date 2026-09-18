import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';
import { extraneousDependenciesDevDependencies } from '@proton/eslint-config-proton/extraneousDependencies';

/** @type {import('eslint').Linter.LanguageOptions['globals']} */
const vitestGlobals = {
    afterAll: 'readonly',
    afterEach: 'readonly',
    beforeAll: 'readonly',
    beforeEach: 'readonly',
    describe: 'readonly',
    expect: 'readonly',
    it: 'readonly',
    test: 'readonly',
    vi: 'readonly',
    vitest: 'readonly',
};

export default defineConfig([
    config,
    {
        rules: {
            'react-hooks/exhaustive-deps': 'warn',
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
        },
    },
    {
        files: ['testing/vitest/**', 'testing/setup/**'],
        languageOptions: {
            globals: vitestGlobals,
        },
    },
    {
        // Mocks @proton/components modules without a manifest dep (cycle constraint).
        files: ['testing/setup/**'],
        rules: {
            'import/no-extraneous-dependencies': 'off',
            'import/no-internal-modules': 'off',
        },
    },
    {
        files: ['testing/**'],
        ignores: ['testing/setup/**'],
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/testing/**'],
                    optionalDependencies: false,
                },
            ],
            'import/no-internal-modules': 'off',
        },
    },
]);
