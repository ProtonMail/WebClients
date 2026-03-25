import { app, screen, net } from "electron";
import { mainLogger } from ".";
import { getOSInfo } from "./getOSInfo";
import { DESKTOP_FEATURES } from "../../ipc/ipcConstants";
import { getOSVersion, isLinux, isMac, isSnap, isWindows, snapRevision } from "../helpers";
import pkg from "../../../package.json";

const SESSION_DELIMITER = "==== SESSION START ====";

export function logInitialAppInfo() {
    mainLogger.info(SESSION_DELIMITER);

    mainLogger.info(
        "App start is mac:",
        isMac,
        "is windows:",
        isWindows,
        "isLinux:",
        isLinux,
        "isSnap:",
        isSnap,
        "snapRevision:",
        snapRevision,
        "version:",
        app.getVersion(),
        "osVersion:",
        getOSVersion(),
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

async function logGPUInfo() {
    try {
        const gpuInfo = await app.getGPUInfo("basic");
        mainLogger.info("GPU info:", JSON.stringify(gpuInfo));
    } catch (error) {
        mainLogger.warn("Could not retrieve GPU info:", error);
    }
}

function logAllDisplaysInfo() {
    try {
        const primaryId = screen.getPrimaryDisplay().id;
        const displayList = screen.getAllDisplays().map((display) => ({
            id: display.id,
            label: display.label,
            primary: display.id === primaryId,
            bounds: display.bounds,
            scaleFactor: display.scaleFactor,
            rotation: display.rotation,
            internal: display.internal,
        }));
        mainLogger.info("Displays:", JSON.stringify(displayList));
    } catch (error) {
        mainLogger.warn("Could not retrieve display info:", error);
    }
}

export function logPostReadyInfo() {
    // logGPUInfo is intentionally not awaited: it can take hundreds of ms and we don't
    // want to block startup. Its log entry will appear later in the session, out of order.
    void logGPUInfo();
    logAllDisplaysInfo();
    mainLogger.info("System info:", JSON.stringify(getOSInfo()));
    mainLogger.info("net.online:", net.isOnline());
    mainLogger.info("Login item settings:", JSON.stringify(app.getLoginItemSettings()));
}
