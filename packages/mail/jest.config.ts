import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
    // Default is 5000 (5seconds)
    testTimeout: 10000,
    preset: 'ts-jest',
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                babelConfig: true,
            },
        ],
    },
    setupFilesAfterEnv: ['./jest.setup.ts'],
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default jestConfig;
