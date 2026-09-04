import type { Config } from 'jest';

const jestConfig: Config = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    preset: '@proton/jest-swc-preset',
    testEnvironment: '@proton/jest-env',
    collectCoverageFrom: ['src/**/*.ts'],
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 100,
            lines: 100,
            statements: 99,
        },
    },
};

export default jestConfig;
