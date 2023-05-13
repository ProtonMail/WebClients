module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverageFrom: ['*.ts', '!tool/*', '!index.ts', '!*.config.ts', '!types.ts'],
    coverageReporters: ['text', 'lcov', 'cobertura'],
};
