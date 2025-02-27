import { IpcMainEvent, ipcMain, shell } from "electron";
import { setReleaseCategory } from "../store/settingsStore";
import { cachedLatestVersion } from "../update";
import type {
    IPCInboxClientUpdateMessage,
    IPCInboxGetInfoMessage,
    IPCInboxGetUserInfoMessage,
} from "@proton/shared/lib/desktop/desktopTypes";
import { clearStorage } from "../utils/helpers";
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
import { getESUserChoice, setESUserChoice } from "../store/userSettingsStore";
import {
    checkDefaultMailto,
    getDefaultMailto,
    setDefaultMailtoApp,
    setDefaultMailtoTelemetryReported,
    setShouldCheckDefaultMailtoApp,
    setDefaultMailtoBannerDismissed,
    getDefaultMailtoBannerDismissed,
} from "../utils/protocol/default";
import { getAllAppVersions, storeAppVersion } from "../utils/appVersions";
import metrics from "../utils/metrics";
import telemetry from "../utils/telemetry";

function isValidClientUpdateMessage(message: unknown): message is IPCInboxClientUpdateMessage {
    return Boolean(message && typeof message === "object" && "type" in message && "payload" in message);
}

export const handleIPCCalls = () => {
    ipcMain.on("hasFeature", (event: IpcMainEvent, message: keyof typeof DESKTOP_FEATURES) => {
        event.returnValue = !!DESKTOP_FEATURES[message];
    });

    ipcMain.on("getUserInfo", (event: IpcMainEvent, message: IPCInboxGetUserInfoMessage["type"], userID: string) => {
        switch (message) {
            case "esUserChoice":
                event.returnValue = getESUserChoice(userID);
                break;
            default:
                ipcLogger.error(`Invalid getUserInfo message: ${message}`);
                break;
        }
    });

    ipcMain.on("getInfo", (event: IpcMainEvent, message: IPCInboxGetInfoMessage["type"]) => {
        switch (message) {
            case "theme":
                event.returnValue = getTheme();
                break;
            case "latestVersion":
                event.returnValue = cachedLatestVersion;
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
                break;
        }
    });

    ipcMain.on("clientUpdate", (_e, message: unknown) => {
        if (!isValidClientUpdateMessage(message)) {
            ipcLogger.error(`Invalid clientUpdate message: ${message}`);
            return;
        }

        const { type, payload } = message;

        switch (type) {
            case "updateNotification":
                handleIPCBadge(payload);
                break;
            case "userLogin":
                resetHiddenViews();
                telemetry.userLogin();
                break;
            case "userLogout":
                resetHiddenViews();
                resetBadge();
                telemetry.userLogout();
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
            case "triggerCrash":
                throw new Error("Crash bandicoot");
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
            default:
                ipcLogger.error(`unknown message type: ${type}`);
                break;
        }
    });
};
