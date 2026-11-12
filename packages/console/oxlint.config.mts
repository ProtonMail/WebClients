import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig({
    restrictedImports: {
        patterns: [
            {
                group: ['@proton/settings', '@proton/settings/*'],
                message:
                    '@proton/console sits below @proton/settings, which imports it. Move shared types or helpers down into @proton/console instead.',
            },
        ],
    },
});
