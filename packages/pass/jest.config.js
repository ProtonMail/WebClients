module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|jsmimeparser|@protontech/mutex-browser|pmcrypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|otpauth|@protontech/pass-rust-core/ui|@protontech/pass-rust-core/worker|client-zip)/)',
    ],
    transform: { '^.+\\.(m?js|tsx?)$': 'babel-jest' },
    coverageReporters: ['text-summary', 'json'],
    moduleNameMapper: {
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
    },
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    resolver: './jest.resolver.js',
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: false,
        DESKTOP_BUILD: false,
    },
};
