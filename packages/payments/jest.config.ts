import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
    setupFilesAfterEnv: ['./jest.setup.ts'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: 'jsdom',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/mutex-browser|pmcrypto|pmcrypto-v6-canary|openpgp|@openpgp/web-stream-tools|@openpgp/asmcrypto.js|@openpgp/noble-hashes|@protontech/bip39|jsmimeparser|emoji-mart|msw|@mswjs)/)',
    ],
    transform: {
        '^.+\\.(ts|js)x?$': '@swc/jest',
    },
    moduleNameMapper: {
        '\\.(css|scss|less)$': '@proton/payments/__mocks__/styleMock.js',
    },
};

export default jestConfig;
