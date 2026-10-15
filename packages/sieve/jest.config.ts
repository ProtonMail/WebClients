import type { Config } from 'jest';

const jestConfig: Config = {
    preset: '@proton/jest-swc-preset',
    testEnvironment: '@proton/jest-env',
};

export default jestConfig;
