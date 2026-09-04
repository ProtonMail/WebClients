import type { Config } from 'jest';

const jestConfig: Config = {
    collectCoverage: true,

    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    preset: '@proton/jest-swc-preset',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/crypto|openpgp|@openpgp/web-stream-tools|otpauth|@protontech/pass-rust-core/ui|@protontech/pass-rust-core/worker|@protontech/autofill|@protontech/fathom|@protontech/ml-inference|@preact/signals-core|@scure/base)/)',
    ],
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    moduleNameMapper: {
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.raw.scss$': '@proton/components/__mocks__/styleMock.js',
    },
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: true,
        DESKTOP_BUILD: false,
    },
};

export default jestConfig;
