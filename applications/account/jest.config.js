module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/mutex-browser|pmcrypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|emoji-mart)/)',
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
            },
        ],
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|pdf|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$':
            '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
    },
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/app/locales.ts'],
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};
