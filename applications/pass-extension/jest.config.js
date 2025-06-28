module.exports = {
    collectCoverage: true,
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|pmcrypto|openpgp|@openpgp/web-stream-tools|otpauth|@protontech/pass-rust-core/ui)/)',
    ],
    transform: { '^.+\\.(m?js|tsx?)$': 'babel-jest' },
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    moduleNameMapper: {
        'proton-pass-extension/(.*)$': ['<rootDir>/src/__mocks__/$1', '<rootDir>/src/$1'],
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
    },
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: true,
        DESKTOP_BUILD: false,
    },
};
