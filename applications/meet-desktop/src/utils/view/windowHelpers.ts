import { BrowserWindowConstructorOptions, app } from "electron";
import { join } from "path";
import { MINIMUM_HEIGHT, MINIMUM_WIDTH, getWindowBounds } from "../../store/boundsStore";
import { isLinux, isMac, isWindows } from "../helpers";
import { appSession } from "../session";
import { MEET_APP_NAME } from "@proton/shared/lib/constants";
import { isProdEnv } from "../isProdEnv";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const getOSSpecificConfig = (): BrowserWindowConstructorOptions => {
    if (isMac) {
        return {
            frame: false,
            titleBarStyle: "hidden",
            vibrancy: "sidebar",
            trafficLightPosition: { x: 12, y: 18 },
            transparent: true,
            webPreferences: {
                transparent: true,
            },
        };
    } else if (isWindows) {
        return {};
    } else if (isLinux) {
        return {};
    }
    return {};
};

export const getWindowConfig = (): BrowserWindowConstructorOptions => {
    const { x, y, width, height } = getWindowBounds();

    return {
        title: isProdEnv() ? MEET_APP_NAME : `${MEET_APP_NAME} Dev`,
        icon: join(app.getAppPath(), "assets/icon.png"),
        x,
        y,
        width,
        height,
        minWidth: MINIMUM_WIDTH,
        minHeight: MINIMUM_HEIGHT,
        autoHideMenuBar: true,
        show: false,
        ...getOSSpecificConfig(),
        webPreferences: {
            devTools: true,
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            // Security additions
            session: appSession(),
            nodeIntegration: false,
            contextIsolation: true,
            disableBlinkFeatures: "Auxclick",
            sandbox: true,
            // Enable screen capture
            enablePreferredSizeMode: false,
            ...(getOSSpecificConfig().webPreferences || {}),
        },
    };
};
