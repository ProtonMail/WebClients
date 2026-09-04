import type { Config } from 'jest';

const jestConfig: Config = {
    preset: '@proton/jest-swc-preset',
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default jestConfig;
