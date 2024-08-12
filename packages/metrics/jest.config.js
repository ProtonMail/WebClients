module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    preset: 'ts-jest',
    testRegex: 'tests/.*\\.test\\.ts$',
    clearMocks: true,
    collectCoverage: true,
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    coverageThreshold: {
        global: {
            branches: 93,
            functions: 100,
            lines: 98,
            statements: 98,
        },
    },
};
