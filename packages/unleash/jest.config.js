module.exports = {
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@proton/telemetry|jsmimeparser|@protontech/mutex-browser|pmcrypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|otpauth)/)',
    ],
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: false,
    },
};
