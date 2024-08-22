import Logger, { LevelOption, LogMessage, TransformFn } from "electron-log";
import { getCurrentView } from "./view/viewManagement";

export function registerLogIPCForwardTransport() {
    const ipcForwardTransport = (message: LogMessage) => {
        const currentView = getCurrentView();

        currentView?.webContents?.send("hostUpdate", {
            type: "captureMessage",
            payload: {
                message: message.data.map((chunk) => `${chunk}`).join(" "),
                level: message.level,
                tags: {},
                extra: {},
            },
        });
    };

    ipcForwardTransport.level = "warn" as LevelOption;
    ipcForwardTransport.transforms = [] as TransformFn[];
    Logger.transports.ipcForward = ipcForwardTransport;
}
