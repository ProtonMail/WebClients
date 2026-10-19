import type { Config } from 'jest';

import { getTransformIgnorePatterns } from '@proton/jest-swc-preset/transformIgnorePatterns.js';

const jestConfig: Config = {
    preset: '@proton/jest-swc-preset',
    setupFilesAfterEnv: ['./jest.setup.js'],
    testEnvironment: '@proton/jest-env',
    transformIgnorePatterns: getTransformIgnorePatterns(['msw', '@mswjs', 'until-async', '@dnd-kit']),
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '<rootDir>/__mocks__/styleMock.js',
    },
    collectCoverageFrom: ['lib/**/*.{js,jsx,ts,tsx}'],
};

export default jestConfig;
