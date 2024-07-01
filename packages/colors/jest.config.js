module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverageFrom: ['*.ts', '!tool/*', '!index.ts', '!*.config.ts', '!types.ts'],
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    coverageThreshold: {
        global: {
            branches: 33,
            functions: 43,
            lines: 42,
            statements: 41,
        },
    },
};
