/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    clearMocks: true,
    preset: "ts-jest",
    testEnvironment: "node",
    setupFiles: ["<rootDir>/jest.setup.ts"],
    transform: {
        "^.+\\.(ts|js|mjs)x?$": [
            "@swc/jest",
            {
                jsc: {
                    transform: {
                        react: {
                            runtime: "automatic",
                        },
                    },
                    parser: {
                        jsx: true,
                        syntax: "typescript",
                        tsx: true,
                    },
                },
                env: {
                    mode: "usage",
                    shippedProposals: true,
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    coreJs: require("core-js/package.json").version,
                },
            },
        ],
    },
    transformIgnorePatterns: [
        "node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/crypto|openpgp|@openpgp/web-stream-tools|otpauth|@protontech/pass-rust-core/ui|@preact/signals-core)/)",
    ],
    moduleNameMapper: {
        "\\.css": "<rootDir>/src/utils/tests/fileMock.ts",
        "^update-electron-app$": "<rootDir>/src/mocks/update-electron-app.ts",
    },
};
