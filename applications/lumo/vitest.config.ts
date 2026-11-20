import react from '@vitejs/plugin-react';
import path from 'path';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    resolve: {
        alias: [
            // reveal.js is embedded as raw text in the artifact iframe (see webpack.reveal.ts); the aliases also
            // bypass its `exports` map, which does not expose the dist paths.
            ...['reveal.js', 'reveal.css', 'theme/simple.css'].map((file) => ({
                find: `reveal.js/dist/${file}`,
                // nosemgrep: path-join-resolve-traversal -- fixed file names from the list above, not user input
                replacement: `${path.resolve(__dirname, 'node_modules/reveal.js/dist', file)}?raw`,
            })),
            {
                find: /^.*\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$/,
                replacement: '@proton/components/__mocks__/fileMock.js',
            },
            // nosemgrep: path-join-resolve-traversal -- constant path to the md mock, not user input
            { find: /\.md$/, replacement: path.resolve(__dirname, './src/__mocks__/mdMock.ts') },
        ],
    },
    test: {
        setupFiles: ['fake-indexeddb/auto', './vitest.setup.ts'],
        server: {
            deps: {
                inline: ['@protontech/crypto'],
            },
        },
    },
});
