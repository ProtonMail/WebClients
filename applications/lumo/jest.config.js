module.exports = {
    testEnvironment: '@proton/jest-env',
    setupFiles: ['fake-indexeddb/auto'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup-env.ts'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    collectCoverage: false,
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/app/locales.ts'],
    resolver: './jest.resolver.js',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/mutex-browser|@protontech/interval-tree|@protontech/telemetry|pmcrypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|jsmimeparser|emoji-mart|msw|@mswjs|p-limit|yocto-queue|sw-test-env|node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)',
    ],
    transform: {
        '^.+\\.(m?js|tsx?)$': '<rootDir>/jest.transform.js',
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
    },
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};
