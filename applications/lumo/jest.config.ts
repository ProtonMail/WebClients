import type { Config } from 'jest';

const jestConfig: Config = {
    testEnvironment: '@proton/jest-env',
    setupFiles: ['fake-indexeddb/auto'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    collectCoverage: false,
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/app/locales.ts'],
    resolver: './jest.resolver.js',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/mutex-browser|@protontech/interval-tree|@protontech/telemetry|@protontech/crypto|@protontech/drive-sdk|openpgp|@openpgp/web-stream-tools|@protontech/bip39|emoji-mart|msw|@mswjs|until-async|p-limit|yocto-queue|sw-test-env|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill|uuid|xlsx|@preact/signals-core|@scure/base|unist-util-visit|unist-util-visit-parents|unist-util-is)/)',
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
