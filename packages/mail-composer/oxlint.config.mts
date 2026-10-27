import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig({
    restrictedImports: {
        patterns: [
            {
                group: ['@proton/mail', '@proton/mail/*'],
                message:
                    '@proton/mail-composer must not depend on @proton/mail. Shared message code belongs in @proton/mail-message; app state is passed in by the host.',
            },
        ],
    },
});
