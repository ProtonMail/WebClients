import type { Config } from 'jest';

const jestConfig: Config = {
    clearMocks: true,
    testEnvironment: 'jsdom',
    preset: '@proton/jest-swc-preset',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default jestConfig;
