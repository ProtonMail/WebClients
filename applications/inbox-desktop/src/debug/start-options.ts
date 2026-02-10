import { app } from "electron";

export function registerDebugStartOptions() {
    if (process.argv.includes("--devtools")) {
        app.on("web-contents-created", (_, webContents) => {
            webContents.on("did-finish-load", () => {
                webContents.openDevTools({ mode: "right" });
            });
        });
    }
}
