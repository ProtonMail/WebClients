import { createOxlintConfig } from '@proton/oxlint-config/createOxlintConfig';

export default createOxlintConfig({
    restrictedImports: {
        patterns: [
            {
                group: [
                    '@proton/mail',
                    '@proton/mail/*',
                    '@proton/mail-renderer',
                    '@proton/mail-renderer/*',
                    '@proton/mail-composer',
                    '@proton/mail-composer/*',
                ],
                message:
                    '@proton/mail-message sits below @proton/mail, @proton/mail-renderer and @proton/mail-composer and must not import them.',
            },
        ],
    },
});
