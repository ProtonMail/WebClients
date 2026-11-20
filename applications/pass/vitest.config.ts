import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vitest/config';

import { sharedVitestConfig } from '@proton/vitest-config/shared';

export default mergeConfig(sharedVitestConfig, {
    plugins: [react()],
    define: {
        BUILD_TARGET: '"test"',
        ENV: '"test"',
        EXTENSION_BUILD: false,
        OFFLINE_SUPPORTED: true,
    },
    resolve: {
        alias: [
            {
                find: /^.*\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$/,
                replacement: '@proton/components/__mocks__/fileMock.js',
            },
            { find: /^proton-pass-web\/(.*)$/, replacement: `${__dirname}/src/$1` },
        ],
    },
    test: {
        coverage: {
            include: ['src/**/*.{js,jsx,ts,tsx}'],
            exclude: ['**/*.d.ts', '**/*.spec.ts', '**/*.spec.tsx', 'src/tests/**', 'src/app/locales.ts'],
        },
        setupFiles: ['./vitest.setup.ts'],
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
