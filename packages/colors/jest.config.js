module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverageFrom: ['*.ts', '!tool/*', '!index.ts', '!*.config.ts', '!types.ts'],
    coverageReporters: ['text', 'lcov', 'cobertura'],
    coverageThreshold: {
        global: {
            branches: 33,
            functions: 43,
            lines: 42,
            statements: 41,
        },
    },
};
