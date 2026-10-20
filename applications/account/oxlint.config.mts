import { defineConfig } from 'oxlint';

import base from '@proton/oxlint-config';
import { allGlobs } from '@proton/oxlint-config/globs';
import { createRestrictedImportRule } from '@proton/oxlint-config/restrictedImports';

export default defineConfig({
    extends: [base],
    overrides: [
        {
            files: allGlobs,
            rules: {
                'proton/restricted-imports': createRestrictedImportRule({
                    rollout: ['account-barrel', 'components-barrel', 'hooks-barrel', 'icon-component'],
                }),
            },
        },
    ],
});
