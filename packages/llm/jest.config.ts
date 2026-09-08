import type { Config } from 'jest';

const jestConfig: Config = {
    preset: '@proton/jest-swc-preset',
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/mutex-browser|@protontech/crypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|emoji-mart|msw|@mswjs|until-async|@dnd-kit|@preact/signals-core|@scure/base)/)',
    ],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '<rootDir>/__mocks__/styleMock.js',
    },
    collectCoverageFrom: ['lib/**/*.{js,jsx,ts,tsx}'],
};

export default jestConfig;
