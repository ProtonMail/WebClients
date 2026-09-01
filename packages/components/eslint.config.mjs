import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelConfig, iconsPackage } from '@proton/eslint-config-proton/barrel';

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
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
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
            'import/no-internal-modules': 'off',
        },
    },
    {
        files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', 'jest.setup.js'],
        rules: {
            'custom-rules/no-package-self-import': 'off',
            'import/no-extraneous-dependencies': 'off',
            'import/no-internal-modules': 'off',
        },
    },
]);
