import { fileURLToPath } from "node:url";
import { mergeConfig } from "vitest/config";
import { sharedVitestConfig } from "@proton/vitest-config/shared";

export default mergeConfig(sharedVitestConfig, {
    test: {
        environment: "node",
        setupFiles: ["./vitest.setup.ts"],
        clearMocks: true,
    },
    resolve: {
        alias: [
            {
                find: /^.*\.css$/,
                replacement: fileURLToPath(new URL("./src/utils/tests/fileMock.ts", import.meta.url)),
            },
        ],
    },
});
