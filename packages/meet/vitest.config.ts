import react from '@vitejs/plugin-react';
import path from 'path';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        server: {
            deps: {
                inline: ['@protontech/crypto'],
            },
        },
        setupFiles: './vitest.setup.ts',
        coverage: {
            reporter: ['text-summary', 'json', 'clover', 'html'],
        },
    },
    resolve: {
        alias: {
            'proton-meet': path.resolve(__dirname, './src/app'),
        },
    },
});
