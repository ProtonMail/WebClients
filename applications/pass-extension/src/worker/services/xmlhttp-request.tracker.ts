import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/globals/browser';
import type { TabId } from '@proton/pass/types';
import { isFailedRequest } from '@proton/pass/utils/requests';
import { uniqueId } from '@proton/pass/utils/string';
import { UNIX_MINUTE, getEpoch } from '@proton/pass/utils/time';
import { parseUrl } from '@proton/pass/utils/url';

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
    const trackerId = `xmlhttp-tracker-${uniqueId()}`;
    const pendingRequests: Map<string, TrackedRequestData> = new Map();

    const garbageCollect = () => {
        const limit = (getEpoch() - MAX_REQUEST_RETENTION_TIME) * 1_000;
        for (const [requestId, { requestedAt }] of pendingRequests.entries()) {
            if (requestedAt < limit) pendingRequests.delete(requestId);
        }
    };

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

    browser.alarms.create(trackerId, { delayInMinutes: 1, periodInMinutes: 1 });
    browser.alarms.onAlarm.addListener(({ name }) => name === trackerId && garbageCollect());

    browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, filter, ['requestBody']);
    browser.webRequest.onCompleted.addListener(onCompleted, filter);
    browser.webRequest.onErrorOccurred.addListener(onErrorOccured, filter);
};
