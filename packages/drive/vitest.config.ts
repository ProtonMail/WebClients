import react from '@vitejs/plugin-react';
import path from 'path';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    resolve: {
        alias: [
            {
                find: /^.*\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$/,
                replacement: path.resolve(__dirname, '../components/__mocks__/fileMock.js'),
            },
            {
                find: /^.*\.(css|scss|less)$/,
                replacement: path.resolve(__dirname, '../components/__mocks__/styleMock.js'),
            },
            {
                find: /^proton-sandboxed-libraries$/,
                replacement: path.resolve(__dirname, 'modules/sandbox/__mocks__/sandboxedLibraries.ts'),
            },
        ],
    },
    test: {
        pool: 'vmThreads',
        vmMemoryLimit: '400MB',
        exclude: ['**/node_modules/**', 'e2e/**'],
        setupFiles: ['./vitest.setup.ts'],
        server: {
            deps: {
                inline: ['@protontech/crypto'],
            },
        },
    },
});
