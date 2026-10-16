import type { Config } from 'jest';

import { getTransformIgnorePatterns } from '@proton/jest-swc-preset/transformIgnorePatterns.js';

const jestConfig: Config = {
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: getTransformIgnorePatterns(),
    preset: '@proton/jest-swc-preset',
};

export default jestConfig;
