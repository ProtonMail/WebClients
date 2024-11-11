import { app } from "electron";
import { mainLogger } from ".";
import { DESKTOP_FEATURES } from "../../ipc/ipcConstants";
import { isLinux, isMac, isWindows } from "../helpers";
import pkg from "../../../package.json";

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
        "Build info:",
        JSON.stringify({ idaTag: process.env.IDA_TAG, buildTag: process.env.BUILD_TAG, appVersion: pkg.version }),
    );

    mainLogger.info(
        "Desktop features:",
        Object.entries(DESKTOP_FEATURES)
            .map(([key, value]) => `${key}:${value}`)
            .join(", "),
    );
}
