import type { Config } from 'jest';

const jestConfig: Config = {
    testEnvironment: '@proton/jest-env',
    preset: '@proton/jest-swc-preset',
    collectCoverageFrom: ['src/**/*.{ts,tsx}'],
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};

export default jestConfig;
