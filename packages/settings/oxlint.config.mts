import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig({
    restrictedImports: {
        patterns: [
            {
                group: ['proton-account', 'proton-account/*'],
                message:
                    '@proton/settings must not depend on the account application. App state and app-only components are passed in by the host app.',
            },
        ],
    },
});
