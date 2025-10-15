import {
    addBreadcrumb,
    anrIntegration,
    captureMessage,
    childProcessIntegration,
    electronMinidumpIntegration,
    init,
    setTags,
    setUser,
    SeverityLevel,
} from "@sentry/electron/main";
import { appSession, updateSession } from "./session";
import pkg from "../../package.json";
import { app } from "electron";
import { getAppID } from "../store/idStore";
import { isLinux, isMac, isWindows } from "./helpers";
import Logger, { LogMessage, Transport } from "electron-log";
import { getAppURL } from "../store/urlStore";
import { getSettings } from "../store/settingsStore";
import { getAccountView, getCurrentViewID, getMainWindow } from "./view/viewManagement";
import { NET_LOGGER_VIEW_PREFIX, sentryLogger } from "./log";
import { isProdEnv } from "./isProdEnv";
import { getOSInfo } from "./log/getOSInfo";

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
    const meetURL = new URL(getAppURL().meet);
    const environment = meetURL.hostname.replace(/^meet./i, "");
    const release = `${pkg.name}@${pkg.version}+${app.isPackaged ? "packaged" : "unpackaged"}`;
    const dsn = process.env.DESKTOP_SENTRY_DSN.replace("sentry", `${meetURL.host}/api/core/v4/reports/sentry`);

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
        integrations: (defaultIntegrations) => [
            ...defaultIntegrations,
            electronMinidumpIntegration(),
            childProcessIntegration(),
            anrIntegration({ captureStackTrace: true }),
        ],
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
            // We want to skip reporting network logs that are related to a browser view.
            // These should not be related with electron.
            if (scope?.startsWith(NET_LOGGER_VIEW_PREFIX)) {
                return;
            }

            captureMessage(serialize(data), {
                level: LOG_LEVEL_TO_SEVERITY[level],
                tags: { logScope: scope },
                extra: {
                    appID: getAppID(),
                    settings: getSettings(),
                    mainWindow: {
                        isMinimized: getMainWindow().isMinimized(),
                        currentView: getCurrentViewID(),
                        accountViewURL: getAccountView()?.webContents.getURL(),
                    },
                    osInfo: getOSInfo(),
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
