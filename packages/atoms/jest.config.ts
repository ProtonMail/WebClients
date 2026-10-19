import { getTransformIgnorePatterns } from '@proton/jest-swc-preset/transformIgnorePatterns.js';

export default {
    setupFilesAfterEnv: ['./jest.setup.ts'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: getTransformIgnorePatterns(),
    preset: '@proton/jest-swc-preset',

    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '<rootDir>/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
    },
    modulePathIgnorePatterns: ['<rootDir>/tests'],
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    collectCoverageFrom: ['**/*.tsx', '!**/*.stories.tsx'],
};
