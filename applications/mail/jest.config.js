module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!<rootDir>/src/app/locales.ts',
        '!<rootDir>/src/service-worker.js',
        '!<rootDir>/src/app/*.{js,jsx,ts,tsx}',
        '!<rootDir>src/app/components/layout/*.{js,jsx,ts,tsx}',
        '!<rootDir>/src/app/helpers/encryptedSearch/*.{js,jsx,ts,tsx}',
        '!<rootDir>/src/app/containers/eo/*.{js,jsx,ts,tsx}',
        '!<rootDir>/src/app/containers/eo/layout/*.{js,jsx,ts,tsx}',
    ],
    testEnvironment: './jest.env.js',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/mutex-browser|pmcrypto|openpgp|@openpgp/web-stream-tools|@openpgp/asmcrypto.js|@protontech/bip39|jsmimeparser|emoji-mart)/)',
    ],
    transform: {
        '^.+\\.(m?js|tsx?)$': '<rootDir>/jest.transform.js',
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
        'proton-mail/(.*)$': '<rootDir>/src/app/$1',
    },
    reporters: ['default', ['jest-junit', { outputName: 'test-report.xml' }]],
    coverageReporters: ['text', 'lcov', 'cobertura'],
};
