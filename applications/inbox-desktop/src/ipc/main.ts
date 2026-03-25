import { IpcMainEvent, ipcMain, shell } from "electron";
import { performance } from "node:perf_hooks";
import { setReleaseCategory } from "../store/settingsStore";
import { cachedLatestVersion } from "../update/update";
import type {
    IPCInboxClientGetAsyncDataMessage,
    IPCInboxClientUpdateMessage,
    IPCInboxGetInfoMessage,
    IPCInboxGetUserInfoMessage,
} from "@proton/shared/lib/desktop/desktopTypes";
import { clearStorage, isSnap, snapRevision } from "../utils/helpers";
import { ipcLogger } from "../utils/log";
import { getColorScheme, getTheme, isEqualTheme, setTheme } from "../utils/themes";
import {
    reloadHiddenViews,
    resetHiddenViews,
    showEndOfTrial,
    showView,
    getMailView,
} from "../utils/view/viewManagement";
import { DESKTOP_FEATURES } from "./ipcConstants";
import { handleIPCBadge, resetBadge, showNotification } from "./notification";
import { setInstallSourceReported, getInstallSource } from "../store/installInfoStore";
import { clearAllUserSettings, clearUserSettings, getESUserChoice, setESUserChoice } from "../store/userSettingsStore";
import {
    checkDefaultMailto,
    getDefaultMailto,
    setDefaultMailtoApp,
    setDefaultMailtoTelemetryReported,
    setShouldCheckDefaultMailtoApp,
    setDefaultMailtoBannerDismissed,
    getDefaultMailtoBannerDismissed,
    setDefaultMailtoBannerDismissedPermanently,
} from "../utils/protocol/default";
import { getAllAppVersions, storeAppVersion } from "../utils/appVersions";
import metrics from "../utils/metrics";
import telemetry from "../utils/telemetry";
import { toggleAppCache } from "../utils/appCache";
import { getLogs } from "../utils/log/getLogsIPC";
import { showPrintDialog } from "../utils/printing/print";
import { handleLogoutIPC } from "../utils/logout/logout";
import { profiler } from "../utils/profiler/profiler";
import { startOAuthSession, clearOAuthSession } from "../utils/oauthProcess";

function isValidClientUpdateMessage(message: unknown): message is IPCInboxClientUpdateMessage {
    return Boolean(message && typeof message === "object" && "type" in message && "payload" in message);
}

export const handleIPCCalls = () => {
    ipcMain.on("hasFeature", (event: IpcMainEvent, message: keyof typeof DESKTOP_FEATURES) => {
        event.returnValue = !!DESKTOP_FEATURES[message];
    });

    ipcMain.on("getUserInfo", (event: IpcMainEvent, message: IPCInboxGetUserInfoMessage["type"], userID: string) => {
        const _t = performance.now();
        try {
            switch (message) {
                case "esUserChoice":
                    event.returnValue = getESUserChoice(userID);
                    break;
                default:
                    ipcLogger.error(`Invalid getUserInfo message: ${message}`);
                    // We need to return some value or the client will keep waiting indefinitely
                    event.returnValue = null;
                    break;
            }
        } catch (error) {
            ipcLogger.error(`getUserInfo handler threw for message type "${message}":`, error);
            event.returnValue = null;
        }
        profiler.ipcMessage("getUserInfo", message, performance.now() - _t);
    });

    ipcMain.on("getInfo", (event: IpcMainEvent, message: IPCInboxGetInfoMessage["type"]) => {
        const _t = performance.now();
        try {
            switch (message) {
                case "theme":
                    event.returnValue = getTheme();
                    break;
                case "latestVersion":
                    event.returnValue = cachedLatestVersion;
                    break;
                case "isSnap":
                    event.returnValue = isSnap;
                    break;
                case "snapRevision":
                    event.returnValue = snapRevision;
                    break;
                case "installSource": {
                    const installSource = getInstallSource();
                    event.returnValue = installSource;
                    setInstallSourceReported();
                    break;
                }
                case "defaultMailto": {
                    event.returnValue = getDefaultMailto();
                    break;
                }
                case "dailyStats": {
                    event.returnValue = telemetry.getDailyStats();
                    break;
                }
                case "colorScheme":
                    event.returnValue = getColorScheme();
                    break;
                case "getAllAppVersions":
                    event.returnValue = getAllAppVersions();
                    break;
                case "defaultMailtoBannerDismissed":
                    event.returnValue = getDefaultMailtoBannerDismissed();
                    break;
                default:
                    ipcLogger.error(`Invalid getInfo message: ${message}`);
                    // We need to return some value or the client will keep waiting indefinitely
                    event.returnValue = null;
                    break;
            }
        } catch (error) {
            ipcLogger.error(`getInfo handler threw for message type "${message}":`, error);
            event.returnValue = null;
        }
        profiler.ipcMessage("getInfo", message, performance.now() - _t);
    });

    ipcMain.on("clientUpdate", (_e, message: unknown) => {
        if (!isValidClientUpdateMessage(message)) {
            ipcLogger.error(`Invalid clientUpdate message: ${message}`);
            return;
        }

        const _t = performance.now();
        const { type, payload } = message;

        if (type === "triggerCrash") {
            ipcLogger.error("triggerCrash requested — throwing intentional error");
            throw new Error("Crash bandicoot");
        }

        try {
            switch (type) {
                case "updateNotification":
                    handleIPCBadge(payload);
                    break;
                case "userLogin":
                    resetHiddenViews();
                    telemetry.userLogin();
                    break;
                case "userLogoutV2":
                    handleLogoutIPC();
                    clearUserSettings(payload);
                    break;
                case "logoutAllUsers":
                    handleLogoutIPC();
                    clearAllUserSettings();
                    break;
                case "clearAppData":
                    resetBadge();
                    clearStorage();
                    break;
                case "oauthPopupOpened": {
                    const enabled = payload === "oauthPopupStarted";
                    global.oauthProcess = enabled;
                    ipcLogger.debug("oauthProcess", enabled ? "enabled" : "disabled");
                    break;
                }
                case "oauthPopupOpenedV2": {
                    if (payload.action === "oauthPopupStarted") {
                        startOAuthSession(payload.sessionId, payload.authorizationUrl);
                        ipcLogger.debug("oauthProcess enabled", payload.sessionId, payload.authorizationUrl);
                    } else {
                        clearOAuthSession(payload.sessionId);
                        ipcLogger.debug("oauthProcess disabled", payload.sessionId);
                    }
                    break;
                }
                case "subscriptionModalOpened": {
                    const enabled = payload === "subscriptionModalStarted";
                    global.subscriptionProcess = enabled;
                    ipcLogger.debug("subscriptionProcess", enabled ? "enabled" : "disabled");
                    break;
                }
                case "openExternal":
                    shell.openExternal(payload);
                    break;
                case "trialEnd":
                    resetBadge();
                    showEndOfTrial();
                    break;
                case "changeView":
                    showView(payload);
                    break;
                case "showNotification":
                    showNotification(payload);
                    break;
                case "updateLocale":
                    reloadHiddenViews();
                    break;
                case "setTheme": {
                    if (!isEqualTheme(getTheme(), payload)) {
                        setTheme(payload);
                        reloadHiddenViews();
                    }
                    break;
                }
                case "earlyAccess": {
                    setReleaseCategory(payload);
                    break;
                }
                case "checkDefaultMailtoAndSignal": {
                    checkDefaultMailto();
                    break;
                }
                case "setDefaultMailto": {
                    setDefaultMailtoApp();
                    break;
                }
                case "setShouldCheckDefaultMailto": {
                    setShouldCheckDefaultMailtoApp(payload);
                    break;
                }
                case "defaultMailtoTelemetryReported": {
                    setDefaultMailtoTelemetryReported(payload);
                    break;
                }
                case "checkDailyStatsAndSignal": {
                    telemetry.checkDailyStats();
                    const dailyStatsReport = telemetry.getDailyStatsReport();

                    getMailView()?.webContents?.send("hostUpdate", {
                        type: "dailyStatsChecked",
                        payload: dailyStatsReport,
                    });
                    break;
                }
                case "dailyStatsReported": {
                    telemetry.dailyStatsReported(payload);
                    break;
                }
                case "setESUserChoice": {
                    setESUserChoice(payload.userID, payload.userChoice);
                    break;
                }
                case "storeAppVersion":
                    storeAppVersion(payload);
                    break;
                case "reportTestingError":
                    ipcLogger.error("Testing error");
                    break;
                case "metricsListenerChanged":
                    if (payload === "ready") {
                        metrics.listenerReady();
                    }
                    if (payload === "removed") {
                        metrics.listenerRemoved();
                    }
                    break;
                case "setDefaultMailtoBannerDismissed":
                    setDefaultMailtoBannerDismissed(payload);
                    break;
                case "setDefaultMailtoBannerDismissedPermanently":
                    setDefaultMailtoBannerDismissedPermanently();
                    break;
                case "toggleAppCache":
                    toggleAppCache({ enabled: payload });
                    break;
                case "togglePrintDialog":
                    showPrintDialog(payload);
                    break;
                default:
                    ipcLogger.error(`unknown message type: ${type}`);
                    break;
            }
        } catch (error) {
            ipcLogger.error(`clientUpdate handler threw for message type "${type}":`, error);
        }
        profiler.ipcMessage("clientUpdate", type, performance.now() - _t);
    });

    ipcMain.handle(
        "getAsyncData",
        async (_event, message: IPCInboxClientGetAsyncDataMessage["type"], ...args: unknown[]) => {
            try {
                switch (message) {
                    case "getElectronLogs": {
                        type ElectronLogsMessage = Extract<
                            IPCInboxClientGetAsyncDataMessage,
                            { type: "getElectronLogs" }
                        >;
                        const [maxSize] = args as ElectronLogsMessage["args"];
                        return await getLogs(maxSize);
                    }
                    default:
                        ipcLogger.error(`Invalid getAsyncData message: ${message}`);
                        return null;
                }
            } catch (error) {
                ipcLogger.error(`getAsyncData handler threw for message type "${message}":`, error);
                return null;
            }
        },
    );
};
