/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    moduleDirectories: ['<rootDir>/node_modules', 'node_modules'],
    transform: {
        '^.+\\.tsx?$': 'babel-jest',
    },
    testEnvironment: 'node',
};
