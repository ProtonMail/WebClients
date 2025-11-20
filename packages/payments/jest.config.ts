import { createRequire } from 'module';
import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: [
        'node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/mutex-browser|pmcrypto|openpgp|@openpgp/web-stream-tools|@protontech/bip39|jsmimeparser|emoji-mart|msw|@mswjs|until-async)/)',
    ],
    transform: {
        // experimentally using swc
        '^.+\\.(ts|js)x?$': [
            '@swc/jest',
            {
                jsc: {
                    transform: {
                        react: {
                            runtime: 'automatic',
                        },
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
    moduleNameMapper: {
        '\\.(css|scss|less)$': '@proton/payments/__mocks__/styleMock.js',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/payments/__mocks__/fileMock.js',
    },
};

export default jestConfig;
