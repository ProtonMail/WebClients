module.exports = {
    preset: 'ts-jest',
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/mutex-browser|pmcrypto|pmcrypto-v6-canary|openpgp|@openpgp/web-stream-tools|@openpgp/asmcrypto.js|@openpgp/noble-hashes|@protontech/bip39|jsmimeparser|emoji-mart|msw|@mswjs)/)',
    ],
    testRegex: 'lib/.*\\.test\\.ts$',
    clearMocks: true,
    collectCoverage: false,
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    transform: {
        '.*': [
            'ts-jest',
            {
                babelConfig: true,
            },
        ],
    },
    resolver: './jest.resolver.js',
};
