import { BrowserWindowConstructorOptions, Session, app } from "electron";
import { getWindowBounds } from "../../store/boundsStore";
import { getConfig, getIcon, isProdEnv } from "../config";
import { isMac, isWindows } from "../helpers";

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
const config = getConfig();

export const areDevToolsAvailable = () => {
    return !app.isPackaged || !isProdEnv(config);
};

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
    }
    return {};
};

export const getWindowConfig = (session: Session): BrowserWindowConstructorOptions => {
    const { x, y, width, height } = getWindowBounds();

    return {
        title: config.appTitle,
        icon: `../../../assets/${getIcon()}.png`,
        x,
        y,
        width,
        height,
        ...getOSSpecificConfig(),
        webPreferences: {
            devTools: areDevToolsAvailable(),
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
