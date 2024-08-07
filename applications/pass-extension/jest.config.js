module.exports = {
    collectCoverage: true,
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: './jest.env.js',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|pmcrypto|pmcrypto-v6-canary|openpgp|@openpgp/web-stream-tools|otpauth)/)',
    ],
    transform: { '^.+\\.(m?js|tsx?)$': 'babel-jest' },
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    moduleNameMapper: {
        'proton-pass-extension/(.*)$': ['<rootDir>/src/__mocks__/$1', '<rootDir>/src/$1'],
    },
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: true,
    },
};
