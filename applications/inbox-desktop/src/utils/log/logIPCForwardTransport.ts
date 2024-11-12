import Logger, { LevelOption, LogMessage, TransformFn } from "electron-log";
import type { SeverityLevel } from "@sentry/types";
import { getCurrentView } from "../view/viewManagement";

export function registerLogIPCForwardTransport() {
    const ipcForwardTransport = (message: LogMessage) => {
        if (message.level !== "error" && message.level !== "warn") {
            return;
        }

        const currentView = getCurrentView();

        const msgLevel: SeverityLevel = message.level === "error" ? "error" : "warning";

        currentView?.webContents?.send("hostUpdate", {
            type: "captureMessage",
            payload: {
                message: message.data.map((chunk) => `${chunk}`).join(" "),
                level: msgLevel,
                tags: {},
                extra: {},
            },
        });
    };

    ipcForwardTransport.level = "warn" as LevelOption;
    ipcForwardTransport.transforms = [] as TransformFn[];
    Logger.transports.ipcForward = ipcForwardTransport;
}
