import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelConfig, iconsPackage } from '@proton/eslint-config-proton/barrel';
import { extraneousDependenciesDevDependencies } from '@proton/eslint-config-proton/extraneousDependencies';
import { iconRestrictedImports, iconRestrictedMessage } from '@proton/eslint-config-proton/icon';

/** @type {import('eslint').Linter.LanguageOptions['globals']} */
const vitestGlobals = {
    assert: 'readonly',
    assertType: 'readonly',
    afterAll: 'readonly',
    afterEach: 'readonly',
    aroundAll: 'readonly',
    aroundEach: 'readonly',
    beforeAll: 'readonly',
    beforeEach: 'readonly',
    chai: 'readonly',
    describe: 'readonly',
    expect: 'readonly',
    expectTypeOf: 'readonly',
    it: 'readonly',
    onTestFailed: 'readonly',
    onTestFinished: 'readonly',
    suite: 'readonly',
    test: 'readonly',
    vi: 'readonly',
    vitest: 'readonly',
};

export default defineConfig([
    defaultConfig,
    createBarrelConfig({ packages: [iconsPackage] }),
    {
        rules: {
            'react/button-has-type': ['warn'],
            'react/forbid-prop-types': ['warn'],
            'react/no-array-index-key': ['warn'],
            'import/no-internal-modules': ['error', { forbid: ['./index', './index'] }],
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    paths: iconRestrictedImports,
                    // The package imports its own modules relatively, which the path
                    // entries above cannot match. `./Icon` covers siblings inside
                    // `components/icon` itself, the form
                    // `custom-rules/no-package-self-import` steers you towards.
                    patterns: [
                        {
                            group: ['**/components/icon/Icon', '**/icon/Icon', './Icon'],
                            message: iconRestrictedMessage,
                        },
                    ],
                },
            ],
        },
    },
    {
        // The deprecated component, its own test, and the barrel re-export that
        // admin, drive, lumo, meet and wallet still rely on for their own
        // remaining `Icon` usages.
        files: ['components/icon/Icon.tsx', 'components/icon/Icon.test.js', 'index.ts'],
        rules: {
            '@typescript-eslint/no-restricted-imports': 'off',
        },
    },
    globalIgnores(['**/iwad/**']),
    {
        files: ['testing/vitest/**'],
        languageOptions: {
            globals: vitestGlobals,
        },
    },
    {
        files: ['testing/**'],
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
    {
        files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', 'jest.setup.js'],
        rules: {
            'import/no-internal-modules': 'off',
        },
    },
]);
