import {
    addBreadcrumb,
    childProcessIntegration,
    electronMinidumpIntegration,
    init,
    setTag,
    setTags,
    setUser,
    SeverityLevel,
} from "@sentry/electron/main";

import { appSession, updateSession } from "./session";
import pkg from "../../package.json";
import { app } from "electron";
import { getAppID } from "../store/idStore";
import { DESKTOP_FEATURES } from "../ipc/ipcConstants";
import { isLinux, isMac, isWindows } from "./helpers";
import Logger, { LogMessage, Transport } from "electron-log";
import { getAppURL } from "../store/urlStore";
import { sentryLogger } from "./log";
import { isProdEnv } from "./isProdEnv";

const MAX_TAG_KEY_LENGTH = 32;

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
    const environment = mailURL.hostname.replace(/^mail\./i, "");
    const release = `${pkg.name}@${pkg.version}+${app.isPackaged ? "packaged" : "unpackaged"}`;
    const dsn = process.env.DESKTOP_SENTRY_DSN.replace("sentry", `mail-api.proton.me/core/v4/reports/sentry`);

    const debug = !isProdEnv();

    init({
        debug,
        beforeSend: (event) => {
            sentryLogger.info(
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

            return event;
        },
        enabled: true,
        dsn,
        // NOTE: Main process session is disabled so this is a no-op. Re-enable MainProcessSession to activate.
        getSessions: () => [appSession(), updateSession()],
        maxBreadcrumbs: 100,
        attachStacktrace: true,
        // Fraction of events sent to sentry (0.0 - 1.0). Set to 1.0 since the desktop app uses explicit
        // opt-in reporting, so volume is already controlled at call sites. If we hit Sentry rate limits we should consider toggling this.
        sampleRate: 1.0,
        environment,
        release,
        integrations: (defaultIntegrations) => {
            const disabledIntegrations = new Set([
                // Intercepts will-quit to send session-end envelope, delaying app exit.
                // Re-enable when release health metrics are needed.
                "MainProcessSession",
                // We handle uncaught exceptions in captureUncaughtErrors.ts with explicit reporting.
                // This integration would cause double-reporting. Therefore disabled.
                "OnUncaughtException",
                // Disable injecting Sentry preload into renderer sessions. Our renderers load Proton
                // web apps that already have their own Sentry setup, and point to the Desktop app DSN.
                "PreloadInjection",
            ]);

            return [
                ...defaultIntegrations.filter((i) => !disabledIntegrations.has(i.name)),
                // Captures native crashes that never reach the JS runtime (segfault, OOM kill).
                electronMinidumpIntegration(),
                // Adds breadcrumbs for all child/renderer process exits so they appear as context on subsequent events.
                // events is set to false such that it disables auto-captureMessage as we report child-process-gone
                // and render-process-gone explicitly in quitTracker.ts.
                childProcessIntegration({
                    events: false,
                    breadcrumbs: [
                        "clean-exit",
                        "abnormal-exit",
                        "killed",
                        "crashed",
                        "oom",
                        "launch-failed",
                        "integrity-failure",
                    ],
                }),
            ];
        },
    });

    setUser({
        id: appID.id,
    });

    setTags({
        "app.version": app.getVersion(),
        "appID.distribution": appID.distribution,
        "appID.hash": appID.hash,
        "os.isMac": isMac,
        "os.isWindows": isWindows,
        "os.isLinux": isLinux,
    });

    for (const [feature, enabled] of Object.entries(DESKTOP_FEATURES)) {
        const tagName = `flag.${feature}`.substring(0, MAX_TAG_KEY_LENGTH);
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
            timestamp: date.getTime() / 1000,
        });
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
