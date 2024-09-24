import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { TabId } from '@proton/pass/types';
import { isFailedRequest } from '@proton/pass/utils/requests';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { epochToMs, getEpoch } from '@proton/pass/utils/time/epoch';
import { parseUrl } from '@proton/pass/utils/url/parser';
import type { URLComponents } from '@proton/pass/utils/url/types';

const filter: WebRequest.RequestFilter = {
    urls: ['<all_urls>'],
    types: ['xmlhttprequest'],
};

type TrackedRequestData = { tabId: TabId; requestedAt: number } & URLComponents;

type XMLHTTPRequestTrackerOptions = {
    acceptRequest: (request: WebRequest.OnBeforeRequestDetailsType) => boolean;
    onFailed: (data: TrackedRequestData) => void;
    onIdle: (tabId: TabId) => void;
};

const MAX_REQUEST_RETENTION_TIME = UNIX_MINUTE;
const IDLE_TIMEOUT = 500;

export const createXMLHTTPRequestTracker = ({ acceptRequest, onIdle, onFailed }: XMLHTTPRequestTrackerOptions) => {
    const requests: Map<string, TrackedRequestData> = new Map();
    const requestCount: Map<TabId, number> = new Map();
    const idleTimers: Map<TabId, NodeJS.Timeout> = new Map();

    const reset = (tabId: TabId) => {
        clearTimeout(idleTimers.get(tabId));
        requestCount.delete(tabId);
        idleTimers.delete(tabId);
    };

    const getRequestCount = (tabId: TabId) => requestCount.get(tabId) ?? 0;
    const onRequestPending = (tabId: TabId) => requestCount.set(tabId, getRequestCount(tabId) + 1);

    const onRequestResolved = (tabId: TabId) => {
        const current = getRequestCount(tabId);
        const next = Math.max(0, current - 1);
        requestCount.set(tabId, next);

        if (next === 0) {
            clearTimeout(idleTimers.get(tabId));

            idleTimers.set(
                tabId,
                setTimeout(() => {
                    const count = getRequestCount(tabId);
                    if (count === 0) {
                        requestCount.delete(tabId);
                        idleTimers.delete(tabId);
                        onIdle(tabId);
                    }
                }, IDLE_TIMEOUT)
            );
        }
    };

    const garbageCollect = (() => {
        let lastGC = getEpoch();

        return () => {
            const now = getEpoch();
            if (now - lastGC < UNIX_MINUTE) return;

            const limit = epochToMs(now - MAX_REQUEST_RETENTION_TIME);
            for (const [requestId, { requestedAt }] of requests.entries()) {
                if (requestedAt < limit) requests.delete(requestId);
            }

            lastGC = now;
        };
    })();

    const onBeforeRequest = async (request: WebRequest.OnBeforeRequestDetailsType) => {
        const { tabId, requestId } = request;
        if (tabId >= 0 && acceptRequest(request)) {
            try {
                const tab = await browser.tabs.get(tabId);
                if (tab.url !== undefined) {
                    onRequestPending(tabId);
                    const { domain, port, protocol } = parseUrl(tab.url);
                    if (domain) {
                        requests.set(requestId, {
                            tabId,
                            domain,
                            port,
                            protocol,
                            requestedAt: request.timeStamp,
                        });
                    }
                }
            } catch (_) {}
        }

        garbageCollect();

        return {}; /* non-blocking */
    };

    const onCompleted = async (request: WebRequest.OnCompletedDetailsType) => {
        const { requestId, tabId } = request;
        const trackedRequest = requests.get(requestId);

        if (trackedRequest !== undefined) {
            if (isFailedRequest(request)) onFailed(trackedRequest);
            onRequestResolved(tabId);
            requests.delete(requestId);
        }
    };

    const onErrorOccured = async (request: WebRequest.OnErrorOccurredDetailsType) => {
        const { requestId, tabId } = request;
        const trackedRequest = requests.get(requestId);

        if (trackedRequest !== undefined) {
            requests.delete(requestId);
            onRequestResolved(tabId);
        }
    };

    if (BUILD_TARGET !== 'safari') {
        browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, filter, ['requestBody']);
        browser.webRequest.onCompleted.addListener(onCompleted, filter);
        browser.webRequest.onErrorOccurred.addListener(onErrorOccured, filter);
    }

    return { reset };
};
