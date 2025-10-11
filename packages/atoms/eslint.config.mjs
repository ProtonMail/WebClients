import storybookConfig from 'eslint-plugin-storybook';
import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import barrelConfig from '@proton/eslint-config-proton/barrel';

export default defineConfig([
    defaultConfig,
    barrelConfig,
    storybookConfig.configs['flat/recommended'],
    {
        rules: {
            'import/no-internal-modules': ['error', { forbid: ['@proton/atoms', '@proton/components'] }],
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
        },
    },
    globalIgnores(['.storybook']),
]);
