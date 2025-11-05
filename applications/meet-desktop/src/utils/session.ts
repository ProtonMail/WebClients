import { app, session, desktopCapturer } from "electron";

import { isHostAllowed } from "./urls/urlTests";
import { ALLOWED_PERMISSIONS } from "../constants";
import { mainLogger } from "./log";

export const appSession = () => {
    return session.fromPartition("persist:app", { cache: false });
};

export const updateSession = () => session.fromPartition("persist:update", { cache: false });

export const setRequestPermission = () => {
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

    // Handle screen sharing with native system picker
    appSession().setDisplayMediaRequestHandler(
        async (request, callback) => {
            try {
                const frame = request.frame;
                if (!frame) {
                    return callback({});
                }

                const { host, protocol } = new URL(frame.url);
                if (!isHostAllowed(host) || protocol !== "https:") {
                    return callback({});
                }

                // Fallback: if system picker is not available, auto-select primary screen
                const sources = await desktopCapturer.getSources({
                    types: ["screen", "window"],
                    thumbnailSize: { width: 150, height: 150 },
                });

                if (sources.length === 0) {
                    return callback({});
                }

                const primaryScreen =
                    sources.find((source) => source.id.startsWith("screen:0:")) ||
                    sources.find((source) => source.id.startsWith("screen")) ||
                    sources[0];

                callback({
                    video: primaryScreen,
                    audio: "loopback",
                });
            } catch (error) {
                callback({});
            }
        },
        { useSystemPicker: true },
    );
};

export const extendAppVersionHeader = () => {
    appSession().webRequest.onBeforeSendHeaders((details, change) => {
        if (!details.requestHeaders["x-pm-appversion"]) {
            change({});
            return;
        }

        details.requestHeaders["x-pm-appversion"] += `+id${app.getVersion()}`;
        change({ requestHeaders: details.requestHeaders });
    });
};
