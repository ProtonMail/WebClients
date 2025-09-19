import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            curly: ['error', 'multi-line'],
        },
    },
    { ignores: ['src/lib/tauri/generated/__bindings__.ts', 'src-tauri/**/*'] },
]);
