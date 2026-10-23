import type { Config } from 'jest';

const jestConfig: Config = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    testPathIgnorePatterns: ['<rootDir>/e2e/'],
    transformIgnorePatterns: [],
    preset: '@proton/jest-swc-preset',
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
    testEnvironment: '@proton/jest-env',
    resolver: './jest.resolver.js',
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '^proton-sandboxed-libraries$': '<rootDir>/modules/sandbox/__mocks__/sandboxedLibraries.ts',
    },
    reporters: ['default'],
};

export default jestConfig;
