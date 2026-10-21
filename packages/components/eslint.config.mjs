import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { extraneousDependenciesDevDependencies } from '@proton/eslint-config-proton/extraneousDependencies';
import { createRestrictedImportsConfig, iconRestrictedMessage } from '@proton/eslint-config-proton/restrictedImports';

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
    createRestrictedImportsConfig({
        rollout: ['account-barrel'],
        // The package imports its own modules relatively, which the path entries of the Icon restriction cannot match.
        // `./Icon` covers siblings inside `components/icon` itself, the form `custom-rules/no-package-self-import`
        // steers you towards.
        patterns: [{ group: ['**/components/icon/Icon', '**/icon/Icon', './Icon'], message: iconRestrictedMessage }],
    }),
    {
        rules: {
            'react/button-has-type': ['warn'],
            'react/forbid-prop-types': ['warn'],
            'react/no-array-index-key': ['warn'],
            'import/no-internal-modules': ['error', { forbid: ['./index', './index'] }],
        },
    },
    // The deprecated component, its own test, and the barrel re-export that admin, drive, lumo, meet and wallet still
    // rely on for their own remaining `Icon` usages.
    createRestrictedImportsConfig({
        files: ['components/icon/Icon.tsx', 'components/icon/Icon.test.js', 'index.ts'],
    }),
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
