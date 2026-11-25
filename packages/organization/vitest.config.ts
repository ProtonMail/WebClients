import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    resolve: {
        alias: [
            {
                find: /^.*\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$/,
                replacement: '@proton/components/__mocks__/fileMock.js',
            },
        ],
    },
    test: {
        environment: 'jsdom',
        // One vm context per file, as in components: TextEncoder then returns the Uint8Array that @proton/polyfill patches
        pool: 'vmThreads',
        clearMocks: true,
        setupFiles: ['./vitest.setup.ts'],
        server: {
            deps: {
                inline: [/msw/, /@mswjs/, /until-async/, /@dnd-kit/],
            },
        },
        coverage: {
            include: ['**/*.{ts,tsx}'],
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx'],
        },
    },
});
