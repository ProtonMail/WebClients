module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: './jest.env.js',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|pmcrypto|openpgp|@openpgp/web-stream-tools|otpauth)/)',
    ],
    transform: { '^.+\\.(m?js|tsx?)$': 'babel-jest' },
    reporters: ['default', ['jest-junit', { outputName: 'test-report.xml' }]],
    testTimeout: 30000,
};
