import react from '@vitejs/plugin-react';
import path from 'path';
import wasm from 'vite-plugin-wasm';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/testing/configs/vitest.config';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react(), wasm()],
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
