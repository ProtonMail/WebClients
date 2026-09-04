import type { Config } from 'jest';

const jestConfig: Config = {
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|mutex-browser|@protontech/crypto|bip39|@preact/signals-core|@scure/base)/)',
    ],
    preset: '@proton/jest-swc-preset',
    setupFilesAfterEnv: ['./jest.setup.ts'],
    testEnvironment: '@proton/jest-env',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '<rootDir>/__mocks__/styleMock.js',
    },
};

export default jestConfig;
