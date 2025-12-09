import { ipcMain } from "electron";
import type { IPCInboxClientUpdateMessage } from "@proton/shared/lib/desktop/desktopTypes";
import { ipcLogger } from "../utils/log";
import { setReleaseCategory } from "../store/settingsStore";
import { DESKTOP_FEATURES } from "./ipcConstants";

export function initializeIPC() {
    // Handle feature checks
    ipcMain.on("hasFeature", (event, feature: keyof typeof DESKTOP_FEATURES) => {
        const hasFeature = DESKTOP_FEATURES[feature] ?? false;
        ipcLogger.info(`Feature check: ${feature} = ${hasFeature}`);
        event.returnValue = hasFeature;
    });

    // Handle client updates from web app
    ipcMain.on("clientUpdate", (_event, message: IPCInboxClientUpdateMessage) => {
        const { type, payload } = message;
        ipcLogger.info(`Received client update: ${type}`, payload);

        switch (type) {
            case "earlyAccess": {
                setReleaseCategory(payload);
                ipcLogger.info(`Release category updated to: ${payload || "stable"}`);
                break;
            }
            default:
                ipcLogger.warn(`Unhandled client update type: ${type}`);
        }
    });

    ipcLogger.info("IPC handlers initialized");
}
