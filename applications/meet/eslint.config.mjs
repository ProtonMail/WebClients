import { defineConfig, globalIgnores } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';

export default defineConfig(config, globalIgnores(['src/background-blur-assets/**/*']), {
    rules: {
        'react-hooks/exhaustive-deps': 'warn',
        // TODO: Remove this rule once the compat issue is resolved
        'compat/compat': 'off',
    },
});
