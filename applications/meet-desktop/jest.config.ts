import type { Config } from "jest";
import { getTransformIgnorePatterns } from "@proton/jest-swc-preset/transformIgnorePatterns.js";

const jestConfig: Config = {
    clearMocks: true,
    testEnvironment: "node",
    setupFiles: ["<rootDir>/jest.setup.ts"],
    preset: "@proton/jest-swc-preset",
    transformIgnorePatterns: getTransformIgnorePatterns(["otpauth", "@protontech/pass-rust-core/ui"]),
    moduleNameMapper: {
        "\\.css": "<rootDir>/src/utils/tests/fileMock.ts",
    },
};

export default jestConfig;
