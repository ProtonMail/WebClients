import react from '@vitejs/plugin-react';
import { configDefaults, mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

/** OpenPGP, zip and stream code needs Node's own typed arrays and streams, which a vm context cannot provide */
const nodeRealmFiles = [
    'lib/bridge/**/*.spec.ts',
    'lib/cache/generate.spec.ts',
    'lib/crypto/**/*.spec.ts',
    'lib/export/archive.spec.ts',
    'lib/extension/model-artifact/**/*.spec.ts',
    'lib/import/providers/1password/**/*.spec.ts',
    'lib/import/providers/bitwarden/**/*.spec.ts',
    'utils/object/serialize.spec.ts',
];

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    define: {
        BUILD_TARGET: '"test"',
        ENV: '"test"',
        EXTENSION_BUILD: false,
        DESKTOP_BUILD: false,
    },
    resolve: {
        alias: [
            {
                find: /^.*\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$/,
                replacement: '@proton/components/__mocks__/fileMock.js',
            },
        ],
    },
    test: {
        coverage: {
            include: ['components/**', 'hooks/**', 'lib/**', 'store/**', 'utils/**'].map((dir) => `${dir}/*.{ts,tsx}`),
            exclude: ['**/*.d.ts', '**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
        },
        setupFiles: ['./vitest.setup.ts'],
        testTimeout: 30000,
        projects: [
            {
                extends: true,
                test: {
                    name: 'vm',
                    // vm contexts build the environment once per worker instead of once per file
                    pool: 'vmForks',
                    // vm contexts can leak memory: recycle a worker once it grows past this limit
                    vmMemoryLimit: '400MB',
                    execArgv: ['--max-old-space-size=1536'],
                    exclude: [...configDefaults.exclude, ...nodeRealmFiles],
                },
            },
            {
                extends: true,
                test: { name: 'node-realm', include: nodeRealmFiles },
            },
        ],
        server: {
            deps: {
                inline: [
                    /imask/,
                    /otpauth/,
                    /@protontech\/pass-rust-core/,
                    /@protontech\/autofill/,
                    /@protontech\/crypto/,
                    /@protontech\/fathom/,
                    /@protontech\/ml-inference/,
                    /client-zip/,
                ],
            },
        },
    },
});
