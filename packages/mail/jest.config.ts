import { createRequire } from 'module';
import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
    // Default is 5000 (5seconds)
    testTimeout: 10000,
    preset: 'ts-jest',
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
                    /* polyfill typed-array base64 and hex functions */ mode: 'usage',
                    shippedProposals: true,
                    coreJs: createRequire(import.meta.url)('core-js/package.json').version,
                },
            },
        ],
    },
    setupFilesAfterEnv: ['./jest.setup.ts'],
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

export default jestConfig;
