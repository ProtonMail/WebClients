import { app } from "electron";
import { mainLogger } from ".";
import { DESKTOP_FEATURES } from "../../ipc/ipcConstants";
import { isLinux, isMac, isWindows } from "../helpers";

export function logInitialAppInfo() {
    mainLogger.info(
        "App start is mac:",
        isMac,
        "is windows:",
        isWindows,
        "isLinux:",
        isLinux,
        "version:",
        app.getVersion(),
        "params",
        process.argv,
    );

    mainLogger.info(
        "Desktop features:",
        Object.entries(DESKTOP_FEATURES)
            .map(([key, value]) => `${key}:${value}`)
            .join(", "),
    );
}
