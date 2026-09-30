import type { Config } from 'jest';

const jestConfig: Config = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    preset: '@proton/jest-swc-preset',
    testRegex: '.*\\.test\\.ts$',
    clearMocks: true,
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};

export default jestConfig;
