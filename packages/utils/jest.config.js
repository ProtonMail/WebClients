module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    preset: 'ts-jest',
    testEnvironment: '@proton/jest-env',
    collectCoverageFrom: ['src/**/*.ts'],
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    coverageThreshold: {
        global: {
            branches: 98,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
};
