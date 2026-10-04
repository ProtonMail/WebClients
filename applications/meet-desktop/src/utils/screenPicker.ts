import {
    BrowserWindow,
    desktopCapturer,
    DesktopCapturerSource,
    dialog,
    screen,
    shell,
    systemPreferences,
} from "electron";
import type { MeetScreenCaptureAccess } from "@proton/shared/lib/desktop/desktopTypes";
import { c } from "ttag";
import {
    SCREEN_PICKER_CHANNELS,
    ScreenPickerInit,
    ScreenPickerSelection,
    ScreenPickerSource,
} from "../screenPicker/types";
import { getSettings, updateSettings } from "../store/settingsStore";
import { FeatureFlag } from "./flags/flags";
import { getFeatureFlagManager } from "./flags/manager";
import { isLinux, isMac, isWindows } from "./helpers";
import { mainLogger } from "./log";
import { getMainWindow } from "./view/viewManagement";

declare const SCREEN_PICKER_WEBPACK_ENTRY: string;
declare const SCREEN_PICKER_PRELOAD_WEBPACK_ENTRY: string;

const REFRESH_INTERVAL = 2000;
const THUMBNAIL_SIZE = { width: 320, height: 180 };

export interface ScreenPickerResult {
    source: DesktopCapturerSource;
    shareAudio: boolean;
}

let isPicking = false;
let activePicker: BrowserWindow | undefined;

const getParentWindow = () => {
    const mainWindow = getMainWindow();
    return mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
};

const getSources = (scaleFactor: number) =>
    desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: {
            width: THUMBNAIL_SIZE.width * scaleFactor,
            height: THUMBNAIL_SIZE.height * scaleFactor,
        },
        fetchWindowIcons: true,
    });

const toPickerSource = (source: DesktopCapturerSource): ScreenPickerSource => {
    const isScreen = source.id.startsWith("screen:");
    const display = isScreen
        ? screen.getAllDisplays().find((display) => String(display.id) === source.display_id)
        : undefined;

    return {
        id: source.id,
        type: isScreen ? "screen" : "window",
        name: display?.label || source.name,
        thumbnail: source.thumbnail.isEmpty() ? "" : source.thumbnail.toDataURL(),
        appIcon: source.appIcon && !source.appIcon.isEmpty() ? source.appIcon.toDataURL() : undefined,
    };
};

const getDefaultSourceId = (sources: DesktopCapturerSource[]) => {
    const primaryDisplayId = String(screen.getPrimaryDisplay().id);
    const screens = sources.filter((source) => source.id.startsWith("screen:"));
    return (screens.find((source) => source.display_id === primaryDisplayId) ?? screens[0])?.id;
};

const isValidSelection = (selection: unknown): selection is ScreenPickerSelection => {
    if (typeof selection !== "object" || selection === null) {
        return false;
    }
    const { id, shareAudio } = selection as Record<string, unknown>;
    return typeof id === "string" && typeof shareAudio === "boolean";
};

// The xdg-desktop-portal shows its own picker during getSources, so ours would be a second one.
export const isWaylandSession = () => isLinux && process.env.XDG_SESSION_TYPE === "wayland";

const SCREEN_CAPTURE_SETTINGS_URL = "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture";

// macOS only shows its own prompt once, so after that the user has to go through System Settings.
export const getScreenCaptureAccess = (): MeetScreenCaptureAccess => {
    if (!isMac || systemPreferences.getMediaAccessStatus("screen") === "granted") {
        return "granted";
    }
    return getSettings().screenCapturePermissionRequested ? "denied" : "not-requested";
};

export const requestScreenCaptureAccess = async (): Promise<MeetScreenCaptureAccess> => {
    const access = getScreenCaptureAccess();
    if (access === "not-requested") {
        updateSettings({ screenCapturePermissionRequested: true });
        // Capturing is what triggers the OS prompt and registers the app in System Settings.
        await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 0, height: 0 } });
    } else if (access === "denied") {
        await shell.openExternal(SCREEN_CAPTURE_SETTINGS_URL);
    }
    return getScreenCaptureAccess();
};

// Without the permission macOS only returns our own windows and a wallpaper-only screen capture,
// so we stop here instead of sharing a black screen. Once granted, macOS itself offers "Quit & Reopen".
export const ensureScreenCapturePermission = async () => {
    const access = getScreenCaptureAccess();
    if (access === "granted") {
        return true;
    }

    if (access === "not-requested") {
        await requestScreenCaptureAccess();
        return false;
    }

    const { t } = c("Screen share permission");
    const options = {
        type: "info" as const,
        buttons: [t`Open System Settings`, t`Cancel`],
        defaultId: 0,
        cancelId: 1,
        message: t`Allow screen recording`,
        detail: t`To share your screen, allow Proton Meet in System Settings > Privacy & Security > Screen & System Audio Recording.`,
    };
    const parent = getParentWindow();
    const { response } = parent ? await dialog.showMessageBox(parent, options) : await dialog.showMessageBox(options);

    if (response === 0) {
        void shell.openExternal(SCREEN_CAPTURE_SETTINGS_URL);
    }
    return false;
};

const getLabels = () => {
    const { t } = c("Screen share picker");
    return {
        title: t`Choose what to share`,
        screensTab: t`Entire screen`,
        windowsTab: t`Window`,
        shareAudio: t`Share system audio`,
        share: t`Share`,
        cancel: t`Cancel`,
        noWindows: t`No windows available to share`,
    };
};

const createPickerWindow = (parent: BrowserWindow | undefined) => {
    const picker = new BrowserWindow({
        parent,
        modal: !!parent,
        show: false,
        width: 760,
        height: 560,
        minWidth: 520,
        minHeight: 400,
        title: getLabels().title,
        backgroundColor: "#16141c",
        autoHideMenuBar: true,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        webPreferences: {
            preload: SCREEN_PICKER_PRELOAD_WEBPACK_ENTRY,
            devTools: getFeatureFlagManager().isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
    });

    picker.webContents.on("will-navigate", (event) => event.preventDefault());
    picker.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    return picker;
};

export const pickScreenSource = async (audioRequested: boolean): Promise<ScreenPickerResult | undefined> => {
    if (isPicking) {
        activePicker?.focus();
        return undefined;
    }
    isPicking = true;

    const parent = getParentWindow();
    const scaleFactor = parent ? screen.getDisplayMatching(parent.getBounds()).scaleFactor : 1;
    let sources: DesktopCapturerSource[];
    try {
        sources = await getSources(scaleFactor);
    } catch (error) {
        isPicking = false;
        throw error;
    }

    const picker = createPickerWindow(parent);
    activePicker = picker;
    const ownSourceId = picker.getMediaSourceId();

    return new Promise((resolve) => {
        let settled = false;
        let refreshTimer: NodeJS.Timeout | undefined;

        const finish = (result: ScreenPickerResult | undefined) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(refreshTimer);
            activePicker = undefined;
            isPicking = false;
            resolve(result);
            if (!picker.isDestroyed()) {
                picker.close();
            }
        };

        const sendSources = () => {
            sources = sources.filter((source) => source.id !== ownSourceId);
            picker.webContents.send(SCREEN_PICKER_CHANNELS.sources, sources.map(toPickerSource));
        };

        const scheduleRefresh = () => {
            refreshTimer = setTimeout(async () => {
                try {
                    const nextSources = await getSources(scaleFactor);
                    if (settled) {
                        return;
                    }
                    sources = nextSources;
                    sendSources();
                } catch (error) {
                    mainLogger.error("Screen picker refresh failed", error);
                }
                if (!settled) {
                    scheduleRefresh();
                }
            }, REFRESH_INTERVAL);
        };

        picker.webContents.ipc.on(SCREEN_PICKER_CHANNELS.select, (_event, selection: unknown) => {
            if (!isValidSelection(selection)) {
                mainLogger.error("Invalid screen picker selection");
                return;
            }
            const source = sources.find(({ id }) => id === selection.id);
            if (source) {
                finish({ source, shareAudio: selection.shareAudio });
            }
        });
        picker.webContents.ipc.on(SCREEN_PICKER_CHANNELS.cancel, () => finish(undefined));
        picker.on("closed", () => finish(undefined));

        picker.webContents.once("did-finish-load", () => {
            const init: ScreenPickerInit = {
                labels: getLabels(),
                showAudioToggle: audioRequested && isWindows,
                defaultSourceId: getDefaultSourceId(sources),
            };
            picker.webContents.send(SCREEN_PICKER_CHANNELS.init, init);
            sendSources();
            picker.show();
            scheduleRefresh();
        });

        picker.loadURL(SCREEN_PICKER_WEBPACK_ENTRY).catch((error) => {
            mainLogger.error("Screen picker failed to load", error);
            finish(undefined);
        });
    });
};
