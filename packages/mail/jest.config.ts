import type { Config } from 'jest';

const jestConfig: Config = {
    // Default is 5000 (5seconds)
    testTimeout: 10000,
    preset: '@proton/jest-swc-preset',
    setupFilesAfterEnv: ['./jest.setup.ts'],
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default jestConfig;
