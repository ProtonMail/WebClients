module.exports = {
    preset: 'ts-jest',
    clearMocks: true,
    testEnvironment: 'jsdom',
    collectCoverageFrom: ['*.ts', '!index.ts'],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
};
