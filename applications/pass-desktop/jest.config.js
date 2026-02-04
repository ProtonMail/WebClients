module.exports = {
    collectCoverage: true,

    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    transform: {
        '^.+\\.(ts|js|mjs)x?$': [
            '@swc/jest',
            {
                jsc: {
                    transform: {
                        react: {
                            runtime: 'automatic',
                        },
                    },
                    parser: {
                        jsx: true,
                        syntax: 'typescript',
                        tsx: true,
                    },
                },
                env: {
                    mode: 'usage',
                    shippedProposals: true,
                    coreJs: require('core-js/package.json').version,
                },
            },
        ],
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|pmcrypto|openpgp|@openpgp/web-stream-tools|otpauth|@protontech/pass-rust-core/ui)/)',
    ],
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    moduleNameMapper: {
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.raw.scss$': '@proton/components/__mocks__/styleMock.js',
        'proton-pass-extension/(.*)$': ['<rootDir>/src/__mocks__/$1', '<rootDir>/src/$1'],
    },
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: true,
        DESKTOP_BUILD: false,
    },
};
