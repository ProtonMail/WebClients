import type { Config } from 'jest';

import { getTransformIgnorePatterns } from '@proton/jest-swc-preset/transformIgnorePatterns.js';

const jestConfig: Config = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    collectCoverageFrom: [
        'components/**/*.{js,jsx,ts,tsx}',
        'containers/**/*.{js,jsx,ts,tsx}',
        'helpers/**/*.{js,jsx,ts,tsx}',
        'hooks/**/*.{js,jsx,ts,tsx}',
        '!src/app/locales.ts',
    ],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: getTransformIgnorePatterns(),
    preset: '@proton/jest-swc-preset',
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
    },
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};

export default jestConfig;
