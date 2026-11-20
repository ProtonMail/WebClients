import react from '@vitejs/plugin-react';
import { createRequire } from 'module';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

const require = createRequire(import.meta.url);

const dateFnsCjs = createRequire(require.resolve('@proton/shared/lib/user/helpers')).resolve('date-fns');

/** `src/lib` and `src/app/worker` specs run on node, but for the ones that need a DOM */
const NEEDS_DOM = ['src/lib/utils/field.sections.spec.ts'];

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    define: {
        BUILD_TARGET: JSON.stringify('test'),
        ENV: JSON.stringify('test'),
        EXTENSION_BUILD: true,
        DESKTOP_BUILD: false,
        E2E_TESTS: false,
        VERSION: JSON.stringify('1.0.0'),
        /** HMR hooks of webpack have no meaning in tests */
        'import.meta.webpackHot': 'undefined',
    },
    resolve: {
        alias: [
            /** The ESM barrel loads ~250 files on every test file: its CommonJS build is a lot faster to load */
            { find: /^date-fns$/, replacement: dateFnsCjs },
            {
                find: /^.*\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$/,
                replacement: require.resolve('@proton/components/__mocks__/fileMock.js'),
            },
            {
                find: /^.*\.(css|scss|less)$/,
                replacement: require.resolve('@proton/components/__mocks__/styleMock.js'),
            },
        ],
    },
    test: {
        globalSetup: '@proton/pass/utils/tests/fixtures/models.download',
        testTimeout: 30000,
        environmentOptions: {
            happyDOM: {
                settings: {
                    /** The API is cross-origin for the page: happy-dom's CORS preflight would reach the network
                     * through the MSW server, which only answers the requests the specs register. */
                    fetch: { disableSameOriginPolicy: true },
                },
            },
        },

        projects: [
            {
                extends: true,
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['src/app/worker/**/*.spec.ts', 'src/lib/**/*.spec.ts'],
                    exclude: NEEDS_DOM,
                    setupFiles: ['./vitest.setup.ts'],
                },
            },
            {
                extends: true,
                test: {
                    name: 'dom',
                    include: ['src/app/content/**/*.spec.{ts,tsx}', 'src/tests/**/*.spec.{ts,tsx}', ...NEEDS_DOM],
                    setupFiles: ['./vitest.setup.ts', './vitest.setup.dom.ts'],
                },
            },
        ],
        server: {
            deps: {
                inline: [/msw/, /@mswjs/, /until-async/, /@protontech\/(autofill|fathom|ml-inference|crypto)/],
            },
        },
    },
});
