import type { Config } from "jest";

const jestConfig: Config = {
    clearMocks: true,
    testEnvironment: "node",
    setupFiles: ["<rootDir>/jest.setup.ts"],
    preset: "@proton/jest-swc-preset",
    // Runs shared URL rule specs so desktop-only MRs still check the rules shared with web.
    roots: ["<rootDir>", "<rootDir>/../../packages/shared/tests/desktop"],
    testMatch: ["<rootDir>/src/**/*.test.ts", "**/packages/shared/tests/desktop/urls.spec.ts"],
    transformIgnorePatterns: [
        "node_modules/(?!(@proton/shared|@proton/components|@protontech/telemetry|@protontech/crypto|openpgp|@openpgp/web-stream-tools|otpauth|@protontech/pass-rust-core/ui|@preact/signals-core)/)",
    ],
    moduleNameMapper: {
        "\\.css": "<rootDir>/src/utils/tests/fileMock.ts",
        "^update-electron-app$": "<rootDir>/src/__mocks__/update-electron-app.ts",
    },
};

export default jestConfig;
