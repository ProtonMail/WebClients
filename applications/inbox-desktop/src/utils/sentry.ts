import { addBreadcrumb, captureMessage, init, setTag, setTags, setUser, SeverityLevel } from "@sentry/electron/main";
import { appSession, updateSession } from "./session";
import pkg from "../../package.json";
import { app } from "electron";
import { getAppID } from "../store/idStore";
import { DESKTOP_FEATURES } from "../ipc/ipcConstants";
import { isLinux, isMac, isWindows } from "./helpers";
import { LogMessage, Transport } from "electron-log";
import { getAppURL } from "../store/urlStore";
import { getSettings } from "../store/settingsStore";
import { getWindowBounds } from "../store/boundsStore";
import { getAccountView, getCalendarView, getCurrentViewID, getMailView, getMainWindow } from "./view/viewManagement";
import { sentryLogger } from "./log";
import { isProdEnv } from "./isProdEnv";

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
    if (!process.env.DESKTOP_SENTRY_DSN) {
        sentryLogger.error("Sentry DSN is not set");
        return;
    }

    const appID = await getAppID();
    const mailURL = new URL(getAppURL().mail);
    const environment = mailURL.hostname.replace(/^mail./i, "");
    const release = `${pkg.name}@${pkg.version}+${app.isPackaged ? "packaged" : "unpackaged"}`;
    const dsn = process.env.DESKTOP_SENTRY_DSN.replace("sentry", `${mailURL.host}/api/core/v4/reports/sentry`);

    const debug = !isProdEnv();

    init({
        debug,
        beforeSend: (event) => {
            if (debug) {
                sentryLogger.silly(
                    "beforeSend",
                    JSON.stringify({
                        level: event.level,
                        type: event.type,
                        message: event.message,
                        tags: event.tags,
                        user: event.user,
                        extra: event.extra,
                    }),
                );
            }

            return event;
        },
        enabled: true,
        dsn,
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
        if (scope === "sentry") {
            return;
        }

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
    // Do not enable this until we are sure we can send logs to sentry
    // Logger.transports.sentry = sentryTransport;
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
