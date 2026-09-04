import type { Config } from 'jest';

const jestConfig: Config = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    preset: '@proton/jest-swc-preset',
    testRegex: '.*\\.test\\.ts$',
    clearMocks: true,
    collectCoverage: true,
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 100,
            lines: 97,
            statements: 97,
        },
    },
};

export default jestConfig;
