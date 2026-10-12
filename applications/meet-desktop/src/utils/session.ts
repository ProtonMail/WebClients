import { app, session, desktopCapturer } from "electron";

import { isHostAllowed } from "./urls/urlTests";
import { ALLOWED_PERMISSIONS } from "../constants";
import { mainLogger } from "./log";
import { isWindows } from "./helpers";
import { ensureScreenCapturePermission, isWaylandSession, pickScreenSource } from "./screenPicker";
import { FeatureFlag } from "./flags/flags";
import { getFeatureFlagManager } from "./flags/manager";

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

    // useSystemPicker is fixed at registration, so the flag (read from cache) applies from the next launch.
    if (!getFeatureFlagManager().isEnabled(FeatureFlag.MEET_DESKTOP_SCREEN_PICKER_ENABLED)) {
        setSystemPickerDisplayMediaHandler();
        return;
    }

    appSession().setDisplayMediaRequestHandler(async (request, callback) => {
        // Electron throws when declining with no streams (the request is still declined), and throws
        // again on a second call, so every response goes through here exactly once.
        let responded = false;
        const respond = (streams: Electron.Streams) => {
            if (responded) {
                return;
            }
            responded = true;
            try {
                callback(streams);
            } catch (error) {
                if (streams.video) {
                    mainLogger.error("Display media response rejected", error instanceof Error ? error.message : error);
                }
            }
        };

        try {
            const frame = request.frame;
            if (!frame) {
                return respond({});
            }

            const { host, protocol } = new URL(frame.url);
            if (!isHostAllowed(host) || protocol !== "https:") {
                return respond({});
            }

            if (isWaylandSession()) {
                const [source] = await desktopCapturer.getSources({ types: ["screen", "window"] });
                return respond(source ? { video: source } : {});
            }

            if (!(await ensureScreenCapturePermission())) {
                return respond({});
            }

            const result = await pickScreenSource(request.audioRequested);
            if (!result) {
                return respond({});
            }

            // "loopback" is the only way to capture system audio on Windows. Electron rewrites it to
            // loopbackWithoutChrome because the renderer requests restrictOwnAudio, which excludes our
            // own playback from the capture. That rewrite requires Electron >= 43.4.0; on older versions
            // restrictOwnAudio is ignored and the capture contains the meeting itself, echoing
            // everyone's voices back into the room.
            // https://www.electronjs.org/docs/latest/api/session#sessetdisplaymediarequesthandlerhandler-opts
            // The key must be left out otherwise: Electron rejects `audio: undefined` when the page asked for audio.
            const shareAudio = request.audioRequested && isWindows && result.shareAudio;
            respond({ video: result.source, ...(shareAudio ? { audio: "loopback" as const } : {}) });
        } catch (error) {
            mainLogger.error("Display media request error", error instanceof Error ? error.message : error);
            respond({});
        }
    });
};

// Native system picker; the handler only runs where it's unavailable (e.g. macOS < 15) and auto-selects the primary screen.
const setSystemPickerDisplayMediaHandler = () => {
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

                // See the "loopback" note above.
                callback({
                    video: primaryScreen,
                    ...(request.audioRequested && isWindows ? { audio: "loopback" as const } : {}),
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
