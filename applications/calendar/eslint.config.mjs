import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports';

export default defineConfig([
    defaultConfig,
    createRestrictedImportsConfig({
        rollout: ['account-barrel', 'components-barrel'],
    }),
    {
        rules: {
            'react-hooks/exhaustive-deps': 'error',
            'no-restricted-syntax': [
                'error',
                {
                    selector: "VariableDeclarator[id.type='ObjectPattern'][init.name=/^[A-Z_]+$/]",
                    message:
                        'Destructuring of enum-like constants is not allowed. Use CONSTANT.PROPERTY instead to maintain code readability.',
                },
            ],
        },
    },
]);
