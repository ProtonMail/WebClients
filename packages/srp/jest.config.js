module.exports = {
    preset: 'ts-jest',
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/mutex-browser|pmcrypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|jsmimeparser|emoji-mart|msw|@mswjs|until-async)/)',
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
