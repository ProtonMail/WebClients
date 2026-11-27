import { fileURLToPath } from "node:url";
import { mergeConfig } from "vitest/config";
import { sharedVitestConfig } from "@proton/vitest-config/shared";

const config = mergeConfig(sharedVitestConfig, {
    test: {
        environment: "node",
        setupFiles: ["./vitest.setup.ts"],
        clearMocks: true,
        include: ["src/**/*.test.ts"],
    },
    resolve: {
        alias: [
            {
                find: /^.*\.css$/,
                replacement: fileURLToPath(new URL("./src/utils/tests/fileMock.ts", import.meta.url)),
            },
            {
                find: /^update-electron-app$/,
                replacement: fileURLToPath(new URL("./src/__mocks__/update-electron-app.ts", import.meta.url)),
            },
        ],
    },
});

// Main-process code runs on Node: don't let the shared "browser" resolve condition pick browser builds.
config.resolve = { ...config.resolve, conditions: ["node"] };

export default config;
