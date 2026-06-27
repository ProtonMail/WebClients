import { BrowserWindowConstructorOptions } from "electron";
import { MINIMUM_HEIGHT, MINIMUM_WIDTH, getWindowBounds } from "../../store/boundsStore";
import { getSettings } from "../../store/settingsStore";
import { isLinux, isMac, isWindows } from "../helpers";
import { appSession } from "../session";
import { MAIL_APP_NAME } from "@proton/shared/lib/constants";
import { isProdEnv } from "../isProdEnv";
import { getIconResourcePath } from "../../constants/resources";

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
    const settings = getSettings();

    // Under Electron 42 the e2e launch flags (--no-sandbox + --disable-gpu) are incompatible
    // with `webPreferences.sandbox: true`: the renderer crashes during preload bootstrap with
    // "Cannot destructure property 'preloadScripts' of 'binding.startupData'", which prevents
    // Playwright from completing electron.launch (65s timeout). In production we still call
    // app.enableSandbox() in index.ts and want the renderer sandbox; in PLAYWRIGHT_TEST mode
    // we already skip app.enableSandbox(), so we must also turn off the renderer-level sandbox.
    const isPlaywrightTest = process.env.PLAYWRIGHT_TEST === "true";

    return {
        title: isProdEnv() ? MAIL_APP_NAME : `${MAIL_APP_NAME} Dev`,
        icon: getIconResourcePath(isWindows ? "icon.ico" : "icon.png"),
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
            sandbox: !isPlaywrightTest,
            ...(getOSSpecificConfig().webPreferences || {}),
        },
    };
};

export const getWindowPlaywrightConfig = (): BrowserWindowConstructorOptions => {
    const config = getWindowConfig();

    return {
        ...config,
        show: true,
        paintWhenInitiallyHidden: false,
        webPreferences: {
            ...config.webPreferences,
            backgroundThrottling: false,
            // Belt and suspenders: even if PLAYWRIGHT_TEST somehow doesn't reach
            // getWindowConfig (e.g. future refactor), this config is reserved for tests
            // and must always disable the renderer sandbox.
            sandbox: false,
        },
    };
};
