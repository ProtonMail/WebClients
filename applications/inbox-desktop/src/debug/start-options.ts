import { app } from "electron";

export function preventRemoteDebugging() {
    const hasRemoteDebuggingFlag = process.argv.some(
        (arg) =>
            arg.startsWith("--remote-debugging-port") ||
            arg.startsWith("--remote-debugging-address") ||
            arg.startsWith("--remote-debugging-pipe"),
    );

    if (hasRemoteDebuggingFlag) {
        console.error("Remote debugging flag detected, forcing exit.");
        process.exit(1);
    }
}

export function registerDebugStartOptions() {
    if (process.argv.includes("--devtools")) {
        app.on("web-contents-created", (_, webContents) => {
            webContents.on("did-finish-load", () => {
                webContents.openDevTools({ mode: "right" });
            });
        });
    }
}
