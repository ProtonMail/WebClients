import type { Config } from 'jest';

const jestConfig: Config = {
    collectCoverage: true,
    restoreMocks: true,
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    setupFiles: ['<rootDir>/jest.setup.js'],
    transformIgnorePatterns: ['node_modules/(?!(@protontech/crypto)/)'],
    preset: '@proton/jest-swc-preset',
    collectCoverageFrom: ['src/**/*.ts'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};

export default jestConfig;
