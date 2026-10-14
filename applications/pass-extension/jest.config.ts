import type { Config } from 'jest';

import swcPreset from '@proton/jest-swc-preset';

const [swcTransformKey, [swcJest, swcOptions]] = Object.entries(swcPreset.transform)[0] as [string, [string, any]];

/** `import.meta` cannot be compiled to CommonJS: drop webpack HMR hooks */
const transform: Config['transform'] = {
    [swcTransformKey]: [
        swcJest,
        {
            ...swcOptions,
            jsc: {
                ...swcOptions.jsc,
                transform: {
                    ...swcOptions.jsc.transform,
                    optimizer: { globals: { vars: { 'import.meta.webpackHot': 'undefined' } } },
                },
            },
        },
    ],
};

const jestConfig: Config = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    preset: '@proton/jest-swc-preset',
    transform,
    transformIgnorePatterns: [
        'node_modules/(?!(\\.pnpm|@proton/shared|@proton/components|@protontech/telemetry|@protontech/crypto|openpgp|@protontech/openpgp|@openpgp/web-stream-tools|otpauth|@protontech/pass-rust-core/ui|@protontech/pass-rust-core/worker|@protontech/autofill|@protontech/fathom|@protontech/ml-inference|@preact/signals-core|@scure/base)/)',
    ],
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    moduleNameMapper: {
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.raw.scss$': '@proton/components/__mocks__/styleMock.js',
    },
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: true,
        DESKTOP_BUILD: false,
        E2E_TESTS: false,
    },
};

export default jestConfig;
