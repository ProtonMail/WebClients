import type { Config } from 'jest';

const jestConfig: Config = {
    preset: '@proton/jest-swc-preset',
    transformIgnorePatterns: ['node_modules/(?!(\\.pnpm|@protontech/crypto|@scure/base)/)'],
    setupFilesAfterEnv: ['./jest.setup.ts'],
    testEnvironment: '@proton/jest-env',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default jestConfig;
