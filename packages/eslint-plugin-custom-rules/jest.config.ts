import type { Config } from 'jest';

const jestConfig: Config = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    preset: '@proton/jest-swc-preset',
};

export default jestConfig;
