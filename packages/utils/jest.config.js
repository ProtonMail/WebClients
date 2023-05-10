module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    preset: 'ts-jest',
    testEnvironment: './jest.env.js',
    collectCoverageFrom: ['*.ts'],
    coverageReporters: ['text', 'lcov', 'cobertura'],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
};
