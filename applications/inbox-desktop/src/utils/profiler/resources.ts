import { performance } from "node:perf_hooks";
import { getAppURL } from "../../store/urlStore";

let startupWindowOpen = false;
const requestStartMap = new Map<number, number>();
const resourceDurations: number[] = [];
let resourceCacheHits = 0;
let resourceCacheMisses = 0;
let resourceFailures = 0;

const mainFrameFirstByteMs = new Map<string, number>();
const mainFrameRequests = new Map<number, string>();

function openResourceWindow(): void {
    startupWindowOpen = true;
}

function closeResourceWindow(): void {
    startupWindowOpen = false;
}

function hookRequestTiming(session: Electron.Session, iifeStart: number): void {
    const appURL = getAppURL();

    session.webRequest.onBeforeRequest((details, callback) => {
        if (startupWindowOpen && ["stylesheet", "script", "image", "font"].includes(details.resourceType)) {
            requestStartMap.set(details.id, performance.now());
        }
        if (details.resourceType === "mainFrame") {
            const viewName = details.url.startsWith(appURL.mail)
                ? "mail"
                : details.url.startsWith(appURL.calendar)
                  ? "calendar"
                  : details.url.startsWith(appURL.account)
                    ? "account"
                    : null;

            // Only track our own views and only once per view
            if (viewName && !mainFrameFirstByteMs.has(viewName)) {
                mainFrameRequests.set(details.id, viewName);
            }
        }
        callback({});
    });

    session.webRequest.onResponseStarted((details) => {
        const viewName = mainFrameRequests.get(details.id);
        if (viewName && !mainFrameFirstByteMs.has(viewName)) {
            mainFrameFirstByteMs.set(viewName, performance.now() - iifeStart);
            mainFrameRequests.delete(details.id);
        }
    });

    session.webRequest.onCompleted((details) => {
        const start = requestStartMap.get(details.id);
        if (start !== undefined) {
            resourceDurations.push(performance.now() - start);
            requestStartMap.delete(details.id);
            if (details.fromCache) resourceCacheHits++;
            else resourceCacheMisses++;
        }
    });

    session.webRequest.onErrorOccurred((details) => {
        if (requestStartMap.has(details.id)) {
            requestStartMap.delete(details.id);
            resourceFailures++;
        }
        mainFrameRequests.delete(details.id);
    });
}

function reset(): void {
    startupWindowOpen = false;
    requestStartMap.clear();
    resourceDurations.length = 0;
    resourceCacheHits = 0;
    resourceCacheMisses = 0;
    resourceFailures = 0;
    mainFrameFirstByteMs.clear();
    mainFrameRequests.clear();
}

function buildResources() {
    const sorted = [...resourceDurations].sort((a, b) => a - b);
    return {
        startupWindow: {
            count: sorted.length,
            failures: resourceFailures,
            fromCache: resourceCacheHits,
            network: resourceCacheMisses,
            avgMs: sorted.length > 0 ? Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length) : null,
            maxMs: sorted.length > 0 ? Math.round(sorted[sorted.length - 1]) : null,
            p95Ms: sorted.length > 0 ? Math.round(sorted[Math.ceil(sorted.length * 0.95) - 1]) : null,
        },
    };
}

export const resources = {
    openResourceWindow,
    closeResourceWindow,
    hookRequestTiming,
    mainFrameFirstByteMs,
    buildResources,
    reset,
};
