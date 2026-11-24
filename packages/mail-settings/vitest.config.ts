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
        clearMocks: true,
        setupFiles: ['./vitest.setup.ts'],
        server: {
            deps: {
                inline: [/msw/, /@mswjs/, /until-async/, '@protontech/crypto', '@scure/base'],
            },
        },
        coverage: {
            include: ['**/*.{ts,tsx}'],
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx'],
        },
    },
});
