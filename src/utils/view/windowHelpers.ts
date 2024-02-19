import { BrowserWindow, BrowserWindowConstructorOptions, Session } from "electron";
import log from "electron-log";
import { getWindowBounds } from "../../store/boundsStore";
import { getConfig } from "../config";
import { isMac, isWindows } from "../helpers";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
const config = getConfig();

const getOSSpecificConfig = (): BrowserWindowConstructorOptions => {
    if (isMac) {
        log.info("getOSSpecificConfig, macOSConfig");
        return {
            frame: false,
            titleBarStyle: "hidden",
            vibrancy: "sidebar",
            trafficLightPosition: { x: 12, y: 18 },
        };
    } else if (isWindows) {
        log.info("getOSSpecificConfig, windowOSConfig");
        return {};
    }
    log.info("getOSSpecificConfig, empty object");
    return {};
};

export const getWindowConfig = (session: Session): BrowserWindowConstructorOptions => {
    const { x, y, width, height } = getWindowBounds();

    return {
        title: config.appTitle,
        icon: "../../../assets/icon.png",
        x,
        y,
        width,
        height,
        ...getOSSpecificConfig(),
        webPreferences: {
            devTools: config.devTools,
            preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            spellcheck: true,
            // Security additions
            session,
            nodeIntegration: false,
            contextIsolation: true,
            disableBlinkFeatures: "Auxclick",
            sandbox: true,
        },
    };
};

export const areAllWindowsClosedOrHidden = () => {
    return BrowserWindow.getAllWindows().every((window) => !window.isVisible());
};
