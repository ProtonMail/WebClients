import { app } from "electron";
import { mainLogger } from ".";
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
        JSON.stringify({ idaTag: process.env.MEET_TAG, buildTag: process.env.BUILD_TAG, appVersion: pkg.version }),
    );
}
