import { app, session } from "electron";

import { isHostAllowed } from "./urls/urlTests";
import { ALLOWED_PERMISSIONS } from "../constants";
import { mainLogger } from "./log";
import { getMailView } from "./view/viewManagement";

export const appSession = () => session.fromPartition("persist:app", { cache: false });
export const updateSession = () => session.fromPartition("persist:update", { cache: false });

export const setRequestPermission = () => {
    // Security addition, reject all permissions except notifications
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
};

let isAppVersionExtensionDisabled = false;
export const FEATURE_FLAG_APPVERSION_EXTENSION_DISABLED = "InboxDesktopAppVersionExtensionDisabled";

// startFeatureCheck periodically retrives stored unleash data in mail view.
// Currently we are only interested in
// FEATURE_FLAG_APPVERSION_EXTENSION_DISABLED,
// this can be reused and extended by more general case in future.
//
// Period one minute was decided to reflect quckly the default refresh 10 min
// interval used to retrieve unleash flags from API.
export const startFeatureCheck = () => {
    checkFeatureFlag();
    setInterval(checkFeatureFlag, 60 * 1000);
};

const checkFeatureFlag = () => {
    const view = getMailView();
    if (!view || !view.webContents) {
        return;
    }

    view.webContents
        .executeJavaScript('localStorage.getItem("unleash:repository:repo");', true)
        .then((result: unknown) => {
            updateFlags(result);
        });
};

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
