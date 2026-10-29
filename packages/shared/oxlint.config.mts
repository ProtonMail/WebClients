import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig({
    ignorePatterns: ['tests/**/*data.js'],
    overrides: [
        {
            // @proton/calendar depends on @proton/shared, so the calendar test builders used here
            // cannot be declared as a dependency without creating a cycle. See INWEB-1236 Phase 7.
            files: ['tests/**'],
            rules: {
                'proton/no-extraneous-dependencies': 'off',
            },
        },
    ],
});
