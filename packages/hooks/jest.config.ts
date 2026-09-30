import type { Config } from 'jest';

const jestConfig: Config = {
    preset: '@proton/jest-swc-preset',
    clearMocks: true,
    testEnvironment: 'jsdom',
    collectCoverageFrom: ['*.ts', '!index.ts'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};

export default jestConfig;
