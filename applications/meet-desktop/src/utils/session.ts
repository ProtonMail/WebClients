import { app, session, desktopCapturer } from "electron";

import { isHostAllowed } from "./urls/urlTests";
import { ALLOWED_PERMISSIONS } from "../constants";
import { mainLogger } from "./log";
import { isWindows } from "./helpers";
import { ensureScreenCapturePermission, isWaylandSession, pickScreenSource } from "./screenPicker";

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

    appSession().setDisplayMediaRequestHandler(async (request, callback) => {
        try {
            const frame = request.frame;
            if (!frame) {
                return callback({});
            }

            const { host, protocol } = new URL(frame.url);
            if (!isHostAllowed(host) || protocol !== "https:") {
                return callback({});
            }

            if (isWaylandSession()) {
                const [source] = await desktopCapturer.getSources({ types: ["screen", "window"] });
                return callback(source ? { video: source } : {});
            }

            if (!(await ensureScreenCapturePermission())) {
                return callback({});
            }

            const result = await pickScreenSource(request.audioRequested);
            if (!result) {
                return callback({});
            }

            // "loopback" is the only way to capture system audio on Windows. Electron rewrites it to
            // loopbackWithoutChrome because the renderer requests restrictOwnAudio, which excludes our
            // own playback from the capture. That rewrite requires Electron >= 43.4.0; on older versions
            // restrictOwnAudio is ignored and the capture contains the meeting itself, echoing
            // everyone's voices back into the room.
            // https://www.electronjs.org/docs/latest/api/session#sessetdisplaymediarequesthandlerhandler-opts
            callback({
                video: result.source,
                audio: request.audioRequested && isWindows && result.shareAudio ? "loopback" : undefined,
            });
        } catch (error) {
            mainLogger.error("Display media request error", error);
            callback({});
        }
    });
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
