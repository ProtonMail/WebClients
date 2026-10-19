import type { Config } from 'jest';

import { getTransformIgnorePatterns } from '@proton/jest-swc-preset/transformIgnorePatterns.js';

const jestConfig: Config = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: getTransformIgnorePatterns(['jsmimeparser', 'msw', '@mswjs', 'until-async']),
    preset: '@proton/jest-swc-preset',
    moduleNameMapper: {
        '\\.(css|scss|less)$': '@proton/payments-ui/__mocks__/styleMock.js',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/payments-ui/__mocks__/fileMock.js',
    },
};

export default jestConfig;
