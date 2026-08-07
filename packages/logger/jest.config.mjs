export default {
    collectCoverage: true,
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },
    collectCoverageFrom: ['**/*.ts'],
    reporters: ['default', ['jest-junit', { suiteNameTemplate: '{filepath}', outputName: 'test-report.xml' }]],
};
