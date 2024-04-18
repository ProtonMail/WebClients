module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: './jest.env.js',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/mutex-browser|pmcrypto|pmcrypto-v6-canary|openpgp|@openpgp/web-stream-tools|@openpgp/asmcrypto.js|@protontech/bip39|emoji-mart)/)',
    ],
    transform: {
        '^.+\\.(m?js|tsx?)$': '<rootDir>/jest.transform.js',
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|pdf|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$':
            '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
    },
    reporters: ['default', ['jest-junit', { outputName: 'test-report.xml' }]],
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/app/locales.ts'],
    coverageReporters: ['text', 'lcov', 'cobertura'],
    resolver: './jest.resolver.js',
};
