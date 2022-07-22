module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
    testEnvironment: './jest.env.js',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/mutex-browser|pmcrypto-v7|openpgp|@openpgp/web-stream-tools|@openpgp/asmcrypto.js|@protontech/bip39|emoji-mart)/)',
    ],
    transform: {
        '^.+\\.(m?js|tsx?)$': '<rootDir>/jest.transform.js',
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
        '@protontech/sieve.js': '@proton/components/__mocks__/sieve.js',
    },
    reporters: ['default', ['jest-junit', { outputName: 'test-report.xml' }]],
    coverageReporters: ['text', 'lcov', 'cobertura'],
};
