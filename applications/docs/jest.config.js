module.exports = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/app/locales.ts'],
  testEnvironment: '@proton/jest-env',
  resolver: './jest.resolver.js',
  transformIgnorePatterns: [
    'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/mutex-browser|@proton/raw-images|pmcrypto|@openpgp/web-stream-tools|jsmimeparser|@protontech/bip39|emoji-mart)/|client-zip)',
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
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
    '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
    '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
    // Support import aliases.
    '^~/components/(.*)$': '<rootDir>/src/app/components/$1',
    '^~/utils/(.*)$': '<rootDir>/src/app/utils/$1',
    '^~/redux-store/(.*)$': '<rootDir>/src/app/redux-store/$1',
    '^~/config$': '<rootDir>/src/app/config',
  },
  coverageReporters: ['text-summary', 'json'],
  reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
}
