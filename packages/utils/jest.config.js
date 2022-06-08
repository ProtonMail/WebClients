module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverageFrom: ['*.ts'],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 78,
            lines: 82,
            statements: 78,
        },
    },
};
