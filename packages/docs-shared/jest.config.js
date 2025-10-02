module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
  collectCoverage: true,
  collectCoverageFrom: ['lib/**/*.{js,jsx,ts,tsx}', '!lib/app/locales.ts'],
  testEnvironment: '@proton/jest-env',
  resolver: './jest.resolver.js',
  transformIgnorePatterns: [
    'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/mutex-browser|pmcrypto|openpgp|@openpgp/web-stream-tools|jsmimeparser|@protontech/bip39|emoji-mart)/|client-zip)',
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
