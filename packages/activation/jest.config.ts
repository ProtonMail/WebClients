import type { Config } from 'jest';

const jestConfig: Config = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!./**/*.interface.ts',
        '!./**/(interface|interfaces).ts',
        '!src/tests/*',
        '!src/tests/**/*',
    ],
    resolver: './jest.resolver.js',
    testEnvironment: '@proton/jest-env',
    testEnvironmentOptions: {
        abortSignal: true,
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/mutex-browser|@protontech/crypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|emoji-mart|msw|@mswjs|until-async|@preact/signals-core|@scure/base)/)',
    ],
    preset: '@proton/jest-swc-preset',
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
    },
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};

export default jestConfig;
