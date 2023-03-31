module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    preset: 'ts-jest',
    testRegex: 'tests/.*\\.test\\.ts$',
    collectCoverage: true,
    clearMocks: true,
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 100,
            lines: 97,
            statements: 97,
        },
    },
};
