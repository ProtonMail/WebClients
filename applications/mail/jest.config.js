module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!<rootDir>/src/**/*.testing.ts',
        '!<rootDir>/src/app/locales.ts',
        '!<rootDir>/src/app/*.{js,jsx,ts,tsx}',
        '!<rootDir>/src/app/components/layout/*.{js,jsx,ts,tsx}',
        '!<rootDir>/src/app/components/onboarding/**/*.{js,jsx,ts,tsx}',
        '!<rootDir>/src/app/helpers/encryptedSearch/**/*.{js,jsx,ts,tsx}',
        '!<rootDir>/src/app/containers/eo/**/*.{js,jsx,ts,tsx}',
    ],
    testEnvironment: '@proton/jest-env',
    resolver: './jest.resolver.js',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@proton/proton-foundation-search|@protontech/telemetry|@protontech/mutex-browser|@protontech/crypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|jsmimeparser|emoji-mart|msw|@mswjs|until-async|@preact/signals-core|@scure/base)/)',
    ],
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
                    /* polyfill needed for typed-array base64 and hex functions */
                    mode: 'usage',
                    shippedProposals: true,
                    coreJs: require('core-js/package.json').version,
                },
            },
        ],
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
        'proton-mail/(.*)$': '<rootDir>/src/app/$1',
    },
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};
