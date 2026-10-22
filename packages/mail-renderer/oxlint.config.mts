import { createOxlintConfig } from '@proton/oxlint-config';
import { allGlobs } from '@proton/oxlint-config/globs';

export default createOxlintConfig({
    overrides: [
        {
            files: allGlobs,
            jsPlugins: ['./lint-rules/index.mjs'],
            rules: { 'mail-renderer/no-direct-iframe-access': 'error' },
        },
        {
            files: ['**/helpers/getIframeDocument.ts', '**/helpers/getIframeDocument.test.ts'],
            rules: { 'mail-renderer/no-direct-iframe-access': 'off' },
        },
    ],
});
