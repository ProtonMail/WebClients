import type { Config } from 'jest';

const jestConfig: Config = {
    preset: '@proton/jest-swc-preset',
    testEnvironment: 'node',
};

export default jestConfig;
