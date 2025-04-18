import { BrowserWindowConstructorOptions, app } from "electron";
import { join } from "path";
import { MINIMUM_HEIGHT, MINIMUM_WIDTH, getWindowBounds } from "../../store/boundsStore";
import { getSettings } from "../../store/settingsStore";
import { isLinux, isMac, isWindows } from "../helpers";
import { appSession } from "../session";
import { MAIL_APP_NAME } from "@proton/shared/lib/constants";
import { isProdEnv } from "../isProdEnv";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const getOSSpecificConfig = (): BrowserWindowConstructorOptions => {
    if (isMac) {
        return {
            frame: false,
            titleBarStyle: "hidden",
            vibrancy: "sidebar",
            trafficLightPosition: { x: 12, y: 18 },
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
    const settings = getSettings();

    return {
        title: isProdEnv() ? MAIL_APP_NAME : `${MAIL_APP_NAME} Dev`,
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
            spellcheck: settings.spellChecker,
            // Security additions
            session: appSession(),
            nodeIntegration: false,
            contextIsolation: true,
            disableBlinkFeatures: "Auxclick",
            sandbox: true,
        },
    };
};
