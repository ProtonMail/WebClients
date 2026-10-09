import type { Config } from 'jest';

const jestConfig: Config = {
    transformIgnorePatterns: [
        'node_modules/(?!(\\.pnpm|@proton/shared|@proton/components|@protontech/telemetry|@protontech/logger|@protontech/mutex-browser|@protontech/crypto|openpgp|@protontech/openpgp|@openpgp/web-stream-tools|@protontech/bip39|otpauth|@preact/signals-core)/)',
    ],
    preset: '@proton/jest-swc-preset',
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: false,
    },
};

export default jestConfig;
