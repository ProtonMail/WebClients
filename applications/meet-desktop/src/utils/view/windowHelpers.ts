import { BrowserWindowConstructorOptions, app, screen } from "electron";
import { join } from "path";
import { isLinux, isMac, isWindows } from "../helpers";
import { appSession } from "../session";
import { MEET_APP_NAME } from "@proton/shared/lib/constants";
import { isProdEnv } from "../isProdEnv";
import { getFeatureFlagManager } from "../flags/manager";
import { FeatureFlag } from "../flags/flags";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export const MINIMUM_WIDTH = 900;
export const MINIMUM_HEIGHT = 300;

export const DEFAULT_WIDTH = 1080;
export const DEFAULT_HEIGHT = 608; // 16:9 aspect ratio (1080 * 9/16 = 607.5, rounded to 608)

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
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // Center the window on screen
    const x = Math.round((screenWidth - Math.min(DEFAULT_WIDTH, screenWidth)) / 2);
    const y = Math.round((screenHeight - Math.min(DEFAULT_HEIGHT, screenHeight)) / 2);

    return {
        title: isProdEnv() ? MEET_APP_NAME : `${MEET_APP_NAME} Dev`,
        icon: join(app.getAppPath(), "assets/icon.png"),
        x,
        y,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        minWidth: MINIMUM_WIDTH,
        minHeight: MINIMUM_HEIGHT,
        autoHideMenuBar: true,
        show: false,
        ...getOSSpecificConfig(),
        webPreferences: {
            devTools: getFeatureFlagManager().isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED),
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
