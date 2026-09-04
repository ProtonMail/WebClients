import type { Config } from 'jest';

const jestConfig: Config = {
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/mutex-browser|@protontech/crypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|emoji-mart|@preact/signals-core|@scure/base)/)',
    ],
    preset: '@proton/jest-swc-preset',
};

export default jestConfig;
