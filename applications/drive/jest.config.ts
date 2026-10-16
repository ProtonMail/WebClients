import type { Config } from 'jest';

import { getTransformIgnorePatterns } from '@proton/jest-swc-preset/transformIgnorePatterns.js';

const jestConfig: Config = {
    forceExit: true,
    setupFilesAfterEnv: ['./jest.setup.js'],
    // No '<rootDir>/node_modules': pnpm puts react-router-dom-v5-compat's react-router@6 there, and resolving it
    // first would hand v6 to every react-router@5 importer, including react-router-dom.
    moduleDirectories: ['node_modules'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/app/locales.ts',
        // Those two files have import.meta.url which is not handled during coverage parsing
        '!src/app/legacy/store/_uploads/initUploadFileWorker.ts',
        '!src/app/legacy/store/_downloads/fileSaver/download.ts',
    ],
    preset: '@proton/jest-swc-preset',
    testEnvironment: '@proton/jest-env',
    resolver: './jest.resolver.js',
    transformIgnorePatterns: getTransformIgnorePatterns([
        '@proton/proton-foundation-search',
        '@protontech/drive-sdk',
        'client-zip',
        'uuid',
    ]),
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm)$': '@proton/components/__mocks__/fileMock.js',
        '\\.(css|scss|less)$': '@proton/components/__mocks__/styleMock.js',
        '\\.(md)$': '<rootDir>/src/__mocks__/mdMock.ts',
    },
    coverageReporters: ['text-summary', 'json'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};

export default jestConfig;
