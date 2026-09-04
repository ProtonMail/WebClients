import type { Config } from 'jest';

const jestConfig: Config = {
    preset: '@proton/jest-swc-preset',
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: 'node',
};

export default jestConfig;
