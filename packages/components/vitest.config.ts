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
        // vm contexts avoid re-creating the whole module graph and jsdom for every file; Node globals missing from
        // the context are restored in vitest.setup.ts
        pool: 'vmThreads',
        // vm contexts can leak memory: recycle a worker once it grows past this limit
        vmMemoryLimit: '400MB',
        clearMocks: true,
        setupFiles: ['./vitest.setup.ts'],
        server: {
            deps: {
                inline: [/msw/, /@mswjs/, /until-async/, /@dnd-kit/],
            },
        },
        coverage: {
            include: [
                'components/**/*.{js,jsx,ts,tsx}',
                'containers/**/*.{js,jsx,ts,tsx}',
                'helpers/**/*.{js,jsx,ts,tsx}',
                'hooks/**/*.{js,jsx,ts,tsx}',
            ],
            exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.test.tsx'],
        },
    },
});
