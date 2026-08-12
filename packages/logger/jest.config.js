import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default {
    collectCoverage: true,
    restoreMocks: true,
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testEnvironment: '@proton/jest-env',
    setupFiles: ['<rootDir>/jest.setup.js'],
    transformIgnorePatterns: ['node_modules/(?!(@protontech/crypto)/)'],
    transform: {
        '^.+\\.(t|j)sx?$': [
            '@swc/jest',
            {
                env: {
                    // Polyfills Uint8Array's base64/hex methods, unavailable unflagged on our pinned Node version.
                    mode: 'usage',
                    shippedProposals: true,
                    coreJs: require('core-js/package.json').version,
                },
            },
        ],
    },
    collectCoverageFrom: ['**/*.ts'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};
