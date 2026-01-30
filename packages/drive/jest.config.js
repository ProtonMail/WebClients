module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    testPathIgnorePatterns: [],
    collectCoverage: false,
    transformIgnorePatterns: [],
    transform: {
        '^.+\\.(ts|js|mjs)x?$': [
            '@swc/jest',
            {
                jsc: {
                    transform: {
                        react: {
                            runtime: 'automatic',
                        },
                    },
                    parser: {
                        jsx: true,
                        syntax: 'typescript',
                        tsx: true,
                    },
                },
            },
        ],
    },
    testEnvironment: '@proton/jest-env',
    moduleNameMapper: {},
    reporters: ['default'],
};
