/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    clearMocks: true,
    preset: "ts-jest",
    testEnvironment: "node",
    setupFiles: ["<rootDir>/jest.setup.ts"],
    moduleNameMapper: {
        "\\.css": "<rootDir>/src/utils/tests/fileMock.ts",
    },
};
