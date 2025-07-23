module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/app/locales.ts'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/mutex-browser|pmcrypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|emoji-mart)/|client-zip|otpauth|@protontech/pass-rust-core/ui)',
    ],
    transform: {
        '^.+\\.(m?js|tsx?)$': '<rootDir>/jest.transform.js',
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
        'proton-pass-web/(.*)$': ['<rootDir>/src/__mocks__/$1', '<rootDir>/src/$1'],
    },
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: false,
        DESKTOP_BUILD: false,
        OFFLINE_SUPPORTED: true,
    },
};
