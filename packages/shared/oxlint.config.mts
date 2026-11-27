import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig({
    ignorePatterns: ['tests/**/*data.js'],
    restrictedImports: {
        patterns: [
            {
                // Depends on this package.
                group: ['@proton/theme', '@proton/theme/*'],
                message: '@proton/shared must not import @proton/theme.',
            },
        ],
    },
});
