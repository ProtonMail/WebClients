import { app, WebContents } from "electron";
import Logger, { Hook, LogMessage, Transport } from "electron-log";
import { CHANGE_VIEW_TARGET } from "@proton/shared/lib/desktop/desktopTypes";
import { appSession } from "../session";
import { isAbsolute } from "node:path";
import { createHash } from "node:crypto";
import metrics from "../metrics";

if (process.env.NODE_ENV === "test") {
    Logger.transports.console.level = "error";
    Logger.transports.file.level = false;
}

export const mainLogger = Logger.scope("main");
export const ipcLogger = Logger.scope("ipc");
export const netLogger = (viewID: CHANGE_VIEW_TARGET | null) =>
    viewID ? Logger.scope(`net/${viewID}`) : Logger.scope("net");
export const settingsLogger = Logger.scope("settings");
export const updateLogger = Logger.scope("update");
export const protocolLogger = Logger.scope("protocol");
export const utilsLogger = Logger.scope("utils");
export const viewLogger = (viewID: CHANGE_VIEW_TARGET | null) => (viewID ? Logger.scope(viewID) : Logger.scope("view"));
export const sentryLogger = Logger.scope("sentry");
export const notificationLogger = Logger.scope("notification");

const filterSensitiveLogMessage: Hook = (msg: LogMessage, _transport?: Transport): LogMessage => {
    return {
        ...msg,
        data: filterSensitiveLogData(msg.data),
    };
};

const filterSensitiveLogData = (data: unknown[]): unknown[] => {
    for (let i = 0; i < data.length; i++) {
        const chunk = data[i];

        if (typeof chunk === "string") {
            const splittedData = getFilteredHomePath(chunk)
                .split(/(\s|\n)+/g)
                .filter((str) => str.trim().length);

            if (splittedData.length > 1) {
                data[i] = filterSensitiveLogData(splittedData).join(" ");
            } else {
                data[i] = filterSensitiveString(chunk);
            }
        } else if (Array.isArray(chunk)) {
            data[i] = filterSensitiveLogData(chunk);
        }
    }

    return data;
};

const isEmail = (str: string) => {
    return /^\S+@\S+\.\S+$/i.test(str);
};

const getFilteredEmail = (email: string) => {
    const [, domain] = email.split("@");

    if (["proton.ch", "proton.me", "protonmail.com", "pm.me"].includes(domain.toLowerCase())) {
        return "__EMAIL_PROTON__";
    }

    return "__EMAIL_NONPROTON__";
};

const isEmailDomain = (key: string, value: string) => {
    return ["identifier"].includes(key.toLowerCase()) && /^@\S+\.\S+$/i.test(value);
};

const getFilteredHomePath = (somePath: string) => {
    const normalizedPath = somePath.replaceAll("\\", "/");
    const basePath = app.getPath("home").replaceAll("\\", "/");
    const basePathRegExp = new RegExp(basePath, "gi");

    if (!basePathRegExp.test(normalizedPath)) {
        return somePath;
    }

    const hasNotASCII = /[^A-Za-z0-9\s-_\\/:.]+/.test(basePath);
    const hash = createHash("sha1").update(basePath).digest("hex");
    const replacement = hasNotASCII ? `/__HOME_NONASCII_${hash}__` : `/__HOME_ASCII_${hash}__`;
    return normalizedPath.replaceAll(basePathRegExp, replacement);
};

const isIDKey = (str: string) => {
    return str.toLowerCase() === "sentry_key";
};

/** @see https://docs.sentry.io/security-legal-pii/scrubbing/server-side-scrubbing/ */
const FORBIDDEN_REGEXP_LIST = [
    /password/gi,
    /secret/gi,
    /passwd/gi,
    /api_key/gi,
    /apikey/gi,
    /access_token/gi,
    /auth/gi,
    /credentials/gi,
    /mysql_pwd/gi,
    /stripetoken/gi,
    /card[0-9]+/gi,
    /github_token/gi,
    /privatekey/gi,
    /private_key/gi,
];

const filterSensitiveString = (data: string): string => {
    let filteredData = data;

    if (URL.canParse(filteredData)) {
        const url = new URL(filteredData);

        filterSearchParams(url.searchParams);

        const pathList = url.pathname.split("/");
        for (let i = 0; i < pathList.length; i++) {
            if (isEmail(pathList[i])) {
                pathList[i] = getFilteredEmail(pathList[i]);
            } else {
                for (const forbiddenRegexp of FORBIDDEN_REGEXP_LIST) {
                    if (forbiddenRegexp.test(pathList[i])) {
                        pathList[i] = "__FORBIDDEN__";
                        break;
                    }
                }
            }
        }
        url.pathname = pathList.join("/");

        if (url.hash) {
            const hashParams = new URLSearchParams(url.hash.substring(1));
            if (hashParams.size) {
                filterSearchParams(hashParams);
                url.hash = hashParams.toString();
            }
        }

        if (url.protocol === "file:") {
            url.pathname = encodeURI(getFilteredHomePath(decodeURI(url.pathname)));
        }

        filteredData = url.toString();
    }

    if (isAbsolute(filteredData)) {
        filteredData = getFilteredHomePath(filteredData);
    }

    return filteredData;
};

function filterSearchParams(params: URLSearchParams) {
    for (const [key, value] of params.entries()) {
        let filteredValue = value;

        for (const forbiddenRegexp of FORBIDDEN_REGEXP_LIST) {
            if (forbiddenRegexp.test(key)) {
                params.delete(key);
                params.set("__FORBIDDEN__", "");
                continue;
            }

            if (forbiddenRegexp.test(filteredValue)) {
                filteredValue = filteredValue.replaceAll(forbiddenRegexp, "__FORBIDDEN__");
            }
        }

        if (isEmail(filteredValue)) {
            params.set(key, getFilteredEmail(filteredValue));
        } else if (isEmailDomain(key, filteredValue)) {
            params.set(key, getFilteredEmail(filteredValue));
        } else if (isIDKey(key)) {
            params.set(key, "__ID__");
        }
    }
}

export function initializeLog() {
    Logger.initialize({ preload: true });
    Logger.transports.file.maxSize = 5 * 1024 * 1024; // 3MB
    Logger.hooks.push(filterSensitiveLogMessage);
    Logger.transports.metrics = metrics.logTransporter;
}

export async function connectNetLogger(
    getWebContentsViewName: (webContents: WebContents) => CHANGE_VIEW_TARGET | null,
) {
    appSession().webRequest.onCompleted((details) => {
        const viewName = details.webContents ? getWebContentsViewName(details.webContents) : null;

        if (details.statusCode >= 200 && details.statusCode < 400) {
            netLogger(viewName).verbose(details.method, details.url, details.statusCode, details.statusLine);
        } else {
            netLogger(viewName).error(
                details.method,
                details.url,
                details.statusCode,
                details.statusLine,
                details.error,
            );
        }
    });
}

export function clearLogs() {
    Logger.transports.file.getFile().clear();
}

// Exported because we want to test we only change sensitve part of LogMessage
export const filterSensitiveLogMessageTestOnly = filterSensitiveLogMessage;
