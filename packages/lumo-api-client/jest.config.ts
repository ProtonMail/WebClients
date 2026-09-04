import type { Config } from 'jest';

const jestConfig: Config = {
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    preset: '@proton/jest-swc-preset',
    testEnvironment: 'node',
};

export default jestConfig;
