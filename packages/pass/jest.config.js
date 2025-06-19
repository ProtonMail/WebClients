module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|jsmimeparser|@protontech/mutex-browser|pmcrypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|otpauth|@protontech/pass-rust-core/ui|@protontech/pass-rust-core/worker|client-zip)/)',
    ],
    transform: {
        '^.+\\.(m?js|tsx?)$': '<rootDir>/jest.transform.js',
    },
    coverageReporters: ['text-summary', 'json'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
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
