module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: './jest.env.js',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|jsmimeparser|@protontech/mutex-browser|pmcrypto|openpgp|@openpgp/web-stream-tools|asmcrypto.js|otpauth)/)',
    ],
    transform: { '^.+\\.(m?js|tsx?)$': 'babel-jest' },
    reporters: ['default', ['jest-junit', { outputName: 'test-report.xml' }]],
    testTimeout: 30000,
};
