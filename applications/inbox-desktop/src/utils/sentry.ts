import { addBreadcrumb, captureMessage, init, setTag, setTags, setUser, SeverityLevel } from "@sentry/electron/main";
import { appSession, updateSession } from "./session";
import pkg from "../../package.json";
import { app } from "electron";
import { getAppID } from "../store/idStore";
import { DESKTOP_FEATURES } from "../ipc/ipcConstants";
import { isLinux, isMac, isWindows } from "./helpers";
import Logger, { LogMessage, Transport } from "electron-log";
import { getAppURL } from "../store/urlStore";
import { getSettings } from "../store/settingsStore";
import { getWindowBounds } from "../store/boundsStore";
import { getAccountView, getCalendarView, getCurrentViewID, getMailView, getMainWindow } from "./view/viewManagement";

const MAX_TAG_LENGTH = 32;

const LOG_LEVEL_TO_SEVERITY: Record<LogMessage["level"], SeverityLevel> = {
    error: "error",
    warn: "warning",
    info: "info",
    debug: "debug",
    verbose: "debug",
    silly: "debug",
};

export async function initializeSentry() {
    const appID = await getAppID();
    const environment = new URL(getAppURL().mail).hostname.replace(/^mail./i, "");
    const release = `${pkg.name}@${pkg.version}+${app.isPackaged ? "packaged" : "unpackaged"}`;

    init({
        debug: !app.isPackaged,
        enabled: true,
        dsn: "https://8c45c7615ac54aed9a6747430e0a5d8e@mail.proton.me/api/core/v4/reports/sentry/54",
        getSessions: () => [appSession(), updateSession()],
        maxBreadcrumbs: 100,
        attachStacktrace: true,
        autoSessionTracking: true,
        environment,
        release,
    });

    setUser({
        id: appID.id,
    });

    setTags({
        "appID.distribution": appID.distribution,
        "appID.hash": appID.hash,
        "os.isMac": isMac,
        "os.isWindows": isWindows,
        "os.isLinux": isLinux,
    });

    for (const [feature, enabled] of Object.entries(DESKTOP_FEATURES)) {
        const tagName = `flag.${feature}`.substring(0, MAX_TAG_LENGTH);
        setTag(tagName, enabled);
    }

    const sentryTransport: Transport = ({ data, level, scope, date }: LogMessage) => {
        addBreadcrumb({
            category: scope,
            level: LOG_LEVEL_TO_SEVERITY[level],
            message: serialize(data),
            timestamp: date.getTime(),
        });

        if (level === "error" || level === "warn") {
            captureMessage(serialize(data), {
                level: LOG_LEVEL_TO_SEVERITY[level],
                tags: { logScope: scope },
                extra: {
                    appID: getAppID(),
                    settings: getSettings(),
                    windowBounds: getWindowBounds(),
                    mainWindow: {
                        isMinimized: getMainWindow().isMinimized(),
                        currentView: getCurrentViewID(),
                        mailViewURL: getMailView()?.webContents.getURL(),
                        calendarViewURL: getCalendarView()?.webContents.getURL(),
                        accountViewURL: getAccountView()?.webContents.getURL(),
                    },
                    appURL: getAppURL(),
                },
            });
        }
    };
    sentryTransport.level = "silly";
    sentryTransport.transforms = [];
    Logger.transports.sentry = sentryTransport;
}

function serialize(value: unknown): string {
    if (typeof value === "string") {
        return value;
    } else if (typeof value === "number") {
        return value.toString();
    } else if (Array.isArray(value)) {
        return value.map((chunk) => serialize(chunk)).join(" ");
    }

    return JSON.stringify(value);
}
