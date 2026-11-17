import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/oxlint-config/extraneousDependencies';

export default createOxlintConfig({
    ignorePatterns: ['testing/vitest/**'],
    restrictedImports: {
        // @proton/components and the account domain UI packages depend on this package.
        patterns: [
            {
                group: [
                    '@proton/components',
                    '@proton/components/*',
                    '@proton/account-recovery',
                    '@proton/account-recovery/*',
                    '@proton/account-security',
                    '@proton/account-security/*',
                    '@proton/byoe',
                    '@proton/byoe/*',
                    '@proton/delegated-access',
                    '@proton/delegated-access/*',
                    '@proton/safety-review',
                    '@proton/safety-review/*',
                ],
                message:
                    'Keep @proton/account free of UI that imports @proton/components; put it in its domain package instead.',
            },
        ],
    },
    overrides: [
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
