import react from '@vitejs/plugin-react';
import path from 'path';
import wasm from 'vite-plugin-wasm';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    // vite-plugin-wasm only inlines the wasm when it sees a plugin named `vitest`, which v5
    // renamed to namespaced ones. Without the marker it serves an unfetchable dev-server URL.
    plugins: [react(), wasm(), { name: 'vitest' }],
    test: {
        server: {
            deps: {
                /**
                 * Declare TS node_modules to transform
                 */
                inline: ['@protontech/crypto'],
            },
        },
        setupFiles: './vitest.setup.ts',
    },
    resolve: {
        alias: {
            'proton-wallet': path.resolve(__dirname, './src/app'),
        },
    },
});
