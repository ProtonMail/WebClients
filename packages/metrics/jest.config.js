module.exports = {
    setupFilesAfterEnv: ['./jest.setup.js'],
    preset: 'ts-jest',
    testRegex: 'tests/.*\\.test\\.ts$',
    collectCoverage: true,
    clearMocks: true,
};
