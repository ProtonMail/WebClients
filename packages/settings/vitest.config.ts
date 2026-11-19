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
        setupFiles: ['./vitest.setup.ts'],
        // vm contexts build the environment once per worker instead of once per file (~14s -> ~3s here).
        // vmForks over vmThreads: measured ~410-440 MB peak RAM vs ~690 MB (vmThreads at 250MB) and ~830 MB-1 GB (400MB),
        // for the same speed. The low limit recycles the worker before vm contexts leak too much memory.
        pool: 'vmForks',
        vmMemoryLimit: '200MB',
        coverage: {
            include: ['src/**/*.{ts,tsx}'],
            exclude: ['src/testing/**'],
        },
    },
});
