module.exports = {
    preset: 'ts-jest',
    testRegex: 'lib/.*\\.test\\.ts$',
    clearMocks: true,
    collectCoverage: false,
    transform: {
        '.*': 'ts-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/crypto|pmcrypto|pmcrypto-v6-canary|jsmimeparser|openpgp|@openpgp/web-stream-tools|@openpgp/asmcrypto.js|@openpgp/noble-hashes|@protontech/bip39|otpauth)/)',
    ],
    resolver: './jest.resolver.js',
};
