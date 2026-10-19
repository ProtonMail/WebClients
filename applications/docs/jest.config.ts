import type { Config } from 'jest'
import { getTransformIgnorePatterns } from '@proton/jest-swc-preset/transformIgnorePatterns.js'

const jestConfig: Config = {
  setupFilesAfterEnv: ['./jest.setup.js'],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/app/locales.ts'],
  testEnvironment: '@proton/jest-env',
  resolver: './jest.resolver.js',
  transformIgnorePatterns: getTransformIgnorePatterns([
    '@proton/raw-images',
    '@protontech/drive-sdk',
    'client-zip',
    'uuid',
  ]),
  preset: '@proton/jest-swc-preset',
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
    '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
    '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
    // Support import aliases.
    '^~/components/(.*)$': '<rootDir>/src/app/components/$1',
    '^~/drive-sdk/(.*)$': '<rootDir>/src/app/drive-sdk/$1',
    '^~/utils/(.*)$': '<rootDir>/src/app/utils/$1',
    '^~/redux-store/(.*)$': '<rootDir>/src/app/redux-store/$1',
    '^~/config$': '<rootDir>/src/app/config',
  },
  coverageReporters: ['text-summary', 'json'],
  reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
}

export default jestConfig
