import { createRequire } from 'module';

export default {
    setupFilesAfterEnv: ['./jest.setup.ts'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
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
                env: {
                    mode: 'usage',
                    shippedProposals: true,
                    coreJs: createRequire(import.meta.url)('core-js/package.json').version,
                },
            },
        ],
    },
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '<rootDir>/__mocks__/styleMock.js',
    },
    collectCoverageFrom: ['**/*.tsx', '**/*.ts', '!index.ts', '!**/*.test.{ts,tsx}'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};
