module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/app/locales.ts',
        // Those two files have import.meta.url which is not handled during coverage parsing
        '!src/app/store/_uploads/initUploadFileWorker.ts',
        '!src/app/store/_downloads/fileSaver/download.ts',
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
    testEnvironment: '@proton/jest-env',
    resolver: './jest.resolver.js',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@proton/telemetry|@protontech/mutex-browser|pmcrypto|openpgp|@openpgp/web-stream-tools|jsmimeparser|@protontech/bip39|emoji-mart)/|client-zip)',
    ],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
    },
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};
