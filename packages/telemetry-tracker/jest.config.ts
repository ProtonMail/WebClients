import type { Config } from 'jest';

const jestConfig: Config = {
    clearMocks: true,
    preset: '@proton/jest-swc-preset',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default jestConfig;
