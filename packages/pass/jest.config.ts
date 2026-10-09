import type { Config } from 'jest';

const jestConfig: Config = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: [
        'node_modules/(?!(\\.pnpm|@proton/shared|@proton/components|@protontech/telemetry|@protontech/logger|@protontech/mutex-browser|@protontech/crypto|openpgp|@protontech/openpgp|@openpgp/web-stream-tools|@protontech/bip39|otpauth|@protontech/pass-rust-core/ui|@protontech/pass-rust-core/worker|@protontech/autofill|@protontech/fathom|@protontech/ml-inference|client-zip|imask|@preact/signals-core|@scure/base)/)',
    ],
    preset: '@proton/jest-swc-preset',
    coverageReporters: ['text-summary', 'json'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
    },
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    resolver: './jest.resolver.js',
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: false,
        DESKTOP_BUILD: false,
    },
};

export default jestConfig;
