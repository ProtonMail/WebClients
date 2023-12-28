import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { TabId } from '@proton/pass/types';
import { isFailedRequest } from '@proton/pass/utils/requests';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { epochToMs, getEpoch } from '@proton/pass/utils/time/epoch';
import { parseUrl } from '@proton/pass/utils/url/parser';

const filter: WebRequest.RequestFilter = {
    urls: ['<all_urls>'],
    types: ['xmlhttprequest'],
};

type TrackedRequestData = { tabId: TabId; domain: string; requestedAt: number };

type XMLHTTPRequestTrackerOptions = {
    acceptRequest: (request: WebRequest.OnBeforeRequestDetailsType) => boolean;
    onFailedRequest: (data: TrackedRequestData) => void;
};

const MAX_REQUEST_RETENTION_TIME = UNIX_MINUTE;

export const createXMLHTTPRequestTracker = ({ acceptRequest, onFailedRequest }: XMLHTTPRequestTrackerOptions) => {
    const pendingRequests: Map<string, TrackedRequestData> = new Map();

    const garbageCollect = (() => {
        let lastGC = getEpoch();

        return () => {
            const now = getEpoch();
            if (now - lastGC < UNIX_MINUTE) return;

            const limit = epochToMs(now - MAX_REQUEST_RETENTION_TIME);

            for (const [requestId, { requestedAt }] of pendingRequests.entries()) {
                if (requestedAt < limit) pendingRequests.delete(requestId);
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
                    const { domain } = parseUrl(tab.url);
                    if (domain) pendingRequests.set(requestId, { tabId, domain, requestedAt: request.timeStamp });
                }
            } catch (_) {}
        }

        garbageCollect();

        return {}; /* non-blocking */
    };

    const onCompleted = async (request: WebRequest.OnCompletedDetailsType) => {
        const { requestId } = request;
        const trackedRequest = pendingRequests.get(requestId);

        if (trackedRequest !== undefined) {
            if (isFailedRequest(request)) onFailedRequest(trackedRequest);
            pendingRequests.delete(requestId);
        }
    };

    const onErrorOccured = async (request: WebRequest.OnErrorOccurredDetailsType) => {
        const { requestId } = request;
        const trackedRequest = pendingRequests.get(requestId);

        if (trackedRequest !== undefined) {
            pendingRequests.delete(requestId);
        }
    };

    browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, filter, ['requestBody']);
    browser.webRequest.onCompleted.addListener(onCompleted, filter);
    browser.webRequest.onErrorOccurred.addListener(onErrorOccured, filter);
};
