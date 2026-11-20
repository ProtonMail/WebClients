import react from '@vitejs/plugin-react';
import path from 'path';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

const fileMock = path.resolve(__dirname, './src/__mocks__/fileMock.js');
const styleMock = path.resolve(__dirname, './src/__mocks__/styleMock.js');

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    test: {
        pool: 'vmThreads',
        vmMemoryLimit: '400MB',
        setupFiles: './vitest.setup.ts',
        alias: [
            {
                find: /^.+\.(jpg|jpeg|png|pdf|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|md)$/,
                replacement: fileMock,
            },
            { find: /^.+\.(css|scss|less)$/, replacement: styleMock },
        ],
    },
});
