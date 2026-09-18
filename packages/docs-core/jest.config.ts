import type { Config } from 'jest'

const { JEST_CACHE_DIRECTORY } = process.env

const jestConfig: Config = {
  ...(JEST_CACHE_DIRECTORY ? { cacheDirectory: JEST_CACHE_DIRECTORY } : {}),
  collectCoverage: process.env.COLLECT_COVERAGE === 'true',
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
  collectCoverageFrom: ['lib/**/*.{js,jsx,ts,tsx}', '!lib/app/locales.ts'],
  testEnvironment: '@proton/jest-env',
  resolver: './jest.resolver.js',
  transformIgnorePatterns: [
    'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/mutex-browser|@proton/raw-images|@protontech/crypto|@protontech/drive-sdk|openpgp|@openpgp/web-stream-tools|@protontech/bip39|emoji-mart|@preact/signals-core|@scure/base)/|client-zip|uuid)',
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
}

export default jestConfig
