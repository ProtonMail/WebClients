import type { Config } from 'jest';

const jestConfig: Config = {
    collectCoverage: true,

    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    preset: '@proton/jest-swc-preset',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/crypto|openpgp|@openpgp/web-stream-tools|otpauth|@protontech/pass-rust-core/ui|@preact/signals-core)/)',
    ],
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    moduleNameMapper: {
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.raw.scss$': '@proton/components/__mocks__/styleMock.js',
        'proton-pass-desktop/(.*)$': ['<rootDir>/src/__mocks__/$1', '<rootDir>/src/$1'],
        '^proton-pass-desktop-native$': ['<rootDir>/src/__mocks__/native/index', '<rootDir>/native/index'],
        'proton-pass-desktop-native/(.*)$': ['<rootDir>/src/__mocks__/native/$1', '<rootDir>/native/$1'],
    },
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: true,
        DESKTOP_BUILD: false,
    },
};

export default jestConfig;
