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

const toPickerSources = (sources: DesktopCapturerSource[]): ScreenPickerSource[] => {
    const { t } = c("Screen share picker");
    const displays = screen.getAllDisplays();
    let screenNumber = 0;

    return sources.map((source) => {
        const thumbnail = source.thumbnail.isEmpty() ? "" : source.thumbnail.toDataURL();

        if (!source.id.startsWith("screen:")) {
            const appIcon = source.appIcon && !source.appIcon.isEmpty() ? source.appIcon.toDataURL() : undefined;
            return { id: source.id, type: "window", name: source.name, thumbnail, appIcon };
        }

        screenNumber += 1;
        const display = displays.find(({ id }) => String(id) === source.display_id);
        const kind = display?.internal ? t`Built-in` : t`External`;
        return {
            id: source.id,
            type: "screen",
            name: t`Display ${screenNumber}`,
            subtitle: display ? `${kind} · ${display.size.width}×${display.size.height}` : undefined,
            thumbnail,
        };
    });
};

// Sharing the meeting window into the meeting only produces a mirror effect, so our own windows
// (main window, picker, any other we open) are never offered. Re-read on each refresh as windows come and go.
const getOwnWindowSourceIds = () =>
    new Set(
        BrowserWindow.getAllWindows()
            .filter((window) => !window.isDestroyed())
            .map((window) => window.getMediaSourceId()),
    );

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
        title: t`Share your screen`,
        screensTab: t`Whole screen`,
        windowsTab: t`Just one app`,
        screensDescription: t`Viewers see your entire screen, including apps and notifications.`,
        windowsDescription: t`Viewers only see this app, even if you switch windows.`,
        showAdvanced: t`Show advanced options`,
        hideAdvanced: t`Hide advanced options`,
        shareAudio: t`Share system audio`,
        share: t`Share`,
        cancel: t`Cancel`,
        close: t`Close`,
        noWindows: t`No windows available to share`,
    };
};

// The picker is drawn as an overlay over the meeting, so it covers and follows the main window's content.
const followParent = (picker: BrowserWindow, parent: BrowserWindow) => {
    const follow = () => {
        if (!picker.isDestroyed() && !parent.isDestroyed()) {
            picker.setBounds(parent.getContentBounds());
        }
    };
    parent.on("move", follow);
    parent.on("resize", follow);
    parent.on("enter-full-screen", follow);
    parent.on("leave-full-screen", follow);
    picker.once("closed", () => {
        parent.off("move", follow);
        parent.off("resize", follow);
        parent.off("enter-full-screen", follow);
        parent.off("leave-full-screen", follow);
    });
};

const createPickerWindow = (parent: BrowserWindow | undefined) => {
    const picker = new BrowserWindow({
        parent,
        show: false,
        ...(parent ? parent.getContentBounds() : { width: 960, height: 680 }),
        title: getLabels().title,
        frame: false,
        transparent: true,
        hasShadow: false,
        backgroundColor: "#00000000",
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        skipTaskbar: true,
        ...(isMac ? { vibrancy: "fullscreen-ui" as const, visualEffectState: "active" as const } : {}),
        webPreferences: {
            preload: SCREEN_PICKER_PRELOAD_WEBPACK_ENTRY,
            devTools: getFeatureFlagManager().isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
        },
    });

    if (parent) {
        followParent(picker, parent);
    }
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
            const ownSourceIds = getOwnWindowSourceIds();
            sources = sources.filter((source) => !ownSourceIds.has(source.id));
            picker.webContents.send(SCREEN_PICKER_CHANNELS.sources, toPickerSources(sources));
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
                blurredBackdrop: isMac,
                defaultSourceId: getDefaultSourceId(sources),
            };
            picker.webContents.send(SCREEN_PICKER_CHANNELS.init, init);
            sendSources();
            picker.show();
            picker.focus();
            scheduleRefresh();
        });

        picker.loadURL(SCREEN_PICKER_WEBPACK_ENTRY).catch((error) => {
            mainLogger.error("Screen picker failed to load", error);
            finish(undefined);
        });
    });
};
