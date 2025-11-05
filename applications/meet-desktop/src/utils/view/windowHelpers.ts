import { BrowserWindowConstructorOptions, app, screen } from "electron";
import { join } from "path";
import { isLinux, isMac, isWindows } from "../helpers";
import { appSession } from "../session";
import { MEET_APP_NAME } from "@proton/shared/lib/constants";
import { isProdEnv } from "../isProdEnv";
import { DEFAULT_ZOOM_FACTOR } from "../../constants/zoom";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export const MINIMUM_WIDTH = 900;
export const MINIMUM_HEIGHT = 300;

export const DEFAULT_WIDTH = 1200;
export const DEFAULT_HEIGHT = 900;

const DEFAULT_WINDOW_BOUNDS = {
    zoom: DEFAULT_ZOOM_FACTOR,
    maximized: true,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    x: -1,
    y: -1,
};

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
    const { x, y } = DEFAULT_WINDOW_BOUNDS;

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    return {
        title: isProdEnv() ? MEET_APP_NAME : `${MEET_APP_NAME} Dev`,
        icon: join(app.getAppPath(), "assets/icon.png"),
        x,
        y,
        width: screenWidth,
        height: screenHeight,
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
