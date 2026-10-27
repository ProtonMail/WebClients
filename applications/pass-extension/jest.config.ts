import type { Config } from 'jest';

import swcPreset from '@proton/jest-swc-preset';
import { getTransformIgnorePatterns } from '@proton/jest-swc-preset/transformIgnorePatterns.js';

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
    globalSetup: '@proton/pass/utils/tests/fixtures/models.download',
    testEnvironment: '@proton/jest-env',
    preset: '@proton/jest-swc-preset',
    transform,
    transformIgnorePatterns: getTransformIgnorePatterns([
        'otpauth',
        '@protontech/pass-rust-core/ui',
        '@protontech/pass-rust-core/worker',
        '@protontech/autofill',
        '@protontech/fathom',
        '@protontech/ml-inference',
        'msw',
        '@mswjs',
        'until-async',
    ]),
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    resolver: './jest.resolver.js',
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
