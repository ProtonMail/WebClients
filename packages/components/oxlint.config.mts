import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';
import { refObjectNullOverride } from '@proton/oxlint-config/react19';

export default createOxlintConfig({
    ignorePatterns: ['**/iwad/**'],
    restrictedImports: {
        // Replaces `import/no-internal-modules` (forbid `./index`), which oxlint's import plugin does not have.
        patterns: [
            { group: ['./index'], message: 'Import from the module directly instead of `./index`.' },
            {
                // The account domain UI packages depend on this package; apps pass their pieces in as children or props.
                group: [
                    '@proton/account-recovery',
                    '@proton/account-recovery/*',
                    '@proton/account-security',
                    '@proton/account-security/*',
                    '@proton/delegated-access',
                    '@proton/delegated-access/*',
                    '@proton/safety-review',
                    '@proton/safety-review/*',
                ],
                message: '@proton/components must not import the account domain packages.',
            },
            {
                // Both depend on this package; apps pass their pieces in as children or props.
                group: ['@proton/activation', '@proton/activation/*', '@proton/byoe', '@proton/byoe/*'],
                message: '@proton/components must not import @proton/activation or @proton/byoe.',
            },
        ],
    },
    overrides: [
        refObjectNullOverride,
        {
            // Tests and `testing/**` only get the base restrictions, without the `./index` ban.
            files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', 'jest.setup.js', 'testing/**'],
            rules: { 'proton/restricted-imports': 'error' },
        },
        {
            files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
            rules: {
                'react/button-has-type': 'warn',
                // `react/forbid-prop-types` is not in oxlint's react plugin, so it is dropped.
                'react/no-array-index-key': 'warn',
            },
        },
        {
            files: ['testing/vitest/**'],
            globals: {
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
            },
        },
        {
            files: ['testing/**'],
            rules: {
                'proton/no-extraneous-dependencies': createExtraneousDependenciesRule({
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/testing/**'],
                }),
            },
        },
    ],
});
