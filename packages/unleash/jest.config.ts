import type { Config } from 'jest';

import { getTransformIgnorePatterns } from '@proton/jest-swc-preset/transformIgnorePatterns.js';

const jestConfig: Config = {
    transformIgnorePatterns: getTransformIgnorePatterns(['otpauth']),
    preset: '@proton/jest-swc-preset',
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
    testTimeout: 30000,
    globals: {
        BUILD_TARGET: 'test',
        ENV: 'test',
        EXTENSION_BUILD: false,
    },
};

export default jestConfig;
