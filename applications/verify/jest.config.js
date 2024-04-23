module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/app/locales.ts'],
    testEnvironment: './jest.env.js',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/mutex-browser|pmcrypto|pmcrypto-v6-canary|@protontech/bip39)/)',
    ],
    transform: {
        '^.+\\.(js|tsx?)$': '<rootDir>/jest.transform.js',
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
    },
    reporters: ['default', ['jest-junit', { outputName: 'test-report.xml' }]],
    coverageReporters: ['text', 'lcov', 'cobertura'],
};
