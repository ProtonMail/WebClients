import type { Config } from 'jest';

const jestConfig: Config = {
    clearMocks: true,
    testEnvironment: "node",
    setupFiles: ["<rootDir>/jest.setup.ts"],
    preset: "@proton/jest-swc-preset",
    transformIgnorePatterns: [
        "node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/crypto|openpgp|@openpgp/web-stream-tools|otpauth|@protontech/pass-rust-core/ui|@preact/signals-core)/)",
    ],
    moduleNameMapper: {
        "\\.css": "<rootDir>/src/utils/tests/fileMock.ts",
    },
};

export default jestConfig;
