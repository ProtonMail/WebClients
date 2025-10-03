import { app, session, desktopCapturer, systemPreferences } from "electron";

import { isHostAllowed } from "./urls/urlTests";
import { ALLOWED_PERMISSIONS } from "../constants";
import { mainLogger } from "./log";
import { getSettings } from "../store/settingsStore";
import { isMac } from "./helpers";

export const appSession = () => {
    const cache = getSettings().appCacheEnabled || false;
    return session.fromPartition("persist:app", { cache });
};

export const updateSession = () => session.fromPartition("persist:update", { cache: false });

export const setRequestPermission = () => {
    // Security addition, reject all permissions except allowed ones
    appSession().setPermissionRequestHandler((webContents, permission, callback) => {
        try {
            const { host, protocol } = new URL(webContents.getURL());
            if (!isHostAllowed(host) || protocol !== "https:") {
                return callback(false);
            }

            if (ALLOWED_PERMISSIONS.includes(permission)) {
                return callback(true);
            }

            mainLogger.info("Permission request rejected", permission);
            callback(false);
        } catch (error) {
            mainLogger.error("Permission request error", error);
            callback(false);
        }
    });

    appSession().setDisplayMediaRequestHandler(async (request, callback) => {
        try {
            const frame = request.frame;
            if (!frame) {
                mainLogger.error("Display media request frame is null");
                return callback({});
            }

            const { host, protocol } = new URL(frame.url);
            if (!isHostAllowed(host) || protocol !== "https:") {
                mainLogger.info("Display media request rejected - invalid host or protocol");
                return callback({});
            }

            mainLogger.info("Display media request approved, fetching sources...");

            if (isMac) {
                const status = systemPreferences.getMediaAccessStatus("screen");
                mainLogger.info(`macOS Screen Recording permission status: ${status}`);

                if (status === "denied") {
                    mainLogger.error(
                        "Screen Recording permission denied. Please grant permission in System Preferences > Privacy & Security > Screen Recording",
                    );
                    callback({});
                    return;
                } else if (status === "not-determined") {
                    mainLogger.info("Screen Recording permission not determined yet, requesting...");
                }
            }

            try {
                const sources = await desktopCapturer.getSources({
                    types: ["screen", "window"],
                    thumbnailSize: { width: 150, height: 150 },
                });

                mainLogger.info(`Desktop capturer returned ${sources.length} sources`);

                if (sources.length === 0) {
                    mainLogger.error(
                        "No desktop capturer sources available - check Screen Recording permission in System Preferences",
                    );
                    callback({});
                    return;
                }

                const screenSource = sources.find((source) => source.id.startsWith("screen")) || sources[0];
                mainLogger.info(`Selected source: ${screenSource.name} (${screenSource.id})`);

                callback({
                    video: screenSource,
                    audio: "loopback",
                    enableLocalEcho: false,
                });
            } catch (err) {
                mainLogger.error("Failed to get desktop capturer sources:", err);
                mainLogger.error(
                    "Make sure Screen Recording permission is granted in System Preferences > Privacy & Security > Screen Recording",
                );
                callback({});
            }
        } catch (error) {
            mainLogger.error("Display media request error:", error);
            callback({});
        }
    });
};

let isAppVersionExtensionDisabled = false;
export const FEATURE_FLAG_APPVERSION_EXTENSION_DISABLED = "InboxDesktopAppVersionExtensionDisabled";

const updateFlags = (flags: unknown) => {
    if (!flags || flags === null) {
        return;
    }

    try {
        if (typeof flags === "string") {
            flags = JSON.parse(flags);
        }
    } catch (_) {
        return;
    }

    if (!Array.isArray(flags)) {
        return;
    }

    let flagFound = false;
    let hasStructure = false;

    flags.find((x, _) => {
        if (typeof x !== "object" || !("name" in x) || !("enabled" in x)) {
            return false;
        }

        hasStructure = true;

        if (x["name"] !== FEATURE_FLAG_APPVERSION_EXTENSION_DISABLED) {
            return false;
        }

        flagFound = true;
        isAppVersionExtensionDisabled = x["enabled"] === true;

        return true;
    });

    if (hasStructure && !flagFound) {
        isAppVersionExtensionDisabled = false;
    }
};

export const extendAppVersionHeader = () => {
    appSession().webRequest.onBeforeSendHeaders((details, change) => {
        if (isAppVersionExtensionDisabled || !details.requestHeaders["x-pm-appversion"]) {
            change({});
            return;
        }

        details.requestHeaders["x-pm-appversion"] += `+id${app.getVersion()}`;
        change({ requestHeaders: details.requestHeaders });
    });
};

export const updateFlagsTestOnly = updateFlags;
export const isAppVersionExtensionDisabledTestOnly = (): boolean => isAppVersionExtensionDisabled;
