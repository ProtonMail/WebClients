import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

const config = mergeConfig(sharedVitestConfig, {
    define: { BUILD_TARGET: '"test"', ENV: '"test"', EXTENSION_BUILD: true, DESKTOP_BUILD: false },
    resolve: {
        alias: [
            {
                find: /^proton-pass-desktop-native$/,
                replacement: fileURLToPath(new URL('./native/index.js', import.meta.url)),
            },
        ],
    },
    test: {
        environment: 'node',
        include: ['src/**/*.{test,spec}.ts'],
    },
});

// Assigned after mergeConfig on purpose: merging would concatenate with the shared "browser" conditions.
config.resolve = { ...config.resolve, conditions: ['node'] };

export default config;
