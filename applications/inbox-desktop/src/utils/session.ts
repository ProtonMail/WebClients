import { app, session } from "electron";

import { isHostAllowed } from "./urls/urlTests";
import { ALLOWED_PERMISSIONS } from "../constants";
import { mainLogger } from "./log";
import { getSettings } from "../store/settingsStore";
import { getFeatureFlagManager } from "./flags/manager";
import { FeatureFlag } from "./flags/flags";

export const appSession = () => {
    const cache = getSettings().appCacheEnabled || false;
    return session.fromPartition("persist:app", { cache });
};

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

export const extendAppVersionHeader = () => {
    const ffManager = getFeatureFlagManager();
    appSession().webRequest.onBeforeSendHeaders((details, change) => {
        if (
            ffManager.isEnabled(FeatureFlag.APPVERSION_EXTENSION_DISABLED) ||
            !details.requestHeaders["x-pm-appversion"]
        ) {
            change({});
            return;
        }

        details.requestHeaders["x-pm-appversion"] += `+id${app.getVersion()}`;
        change({ requestHeaders: details.requestHeaders });
    });
};
