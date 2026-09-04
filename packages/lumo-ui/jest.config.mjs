export default {
    setupFilesAfterEnv: ['./jest.setup.ts'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    preset: '@proton/jest-swc-preset',
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '<rootDir>/__mocks__/styleMock.js',
    },
    collectCoverageFrom: ['**/*.tsx', '**/*.ts', '!index.ts', '!**/*.test.{ts,tsx}'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};
