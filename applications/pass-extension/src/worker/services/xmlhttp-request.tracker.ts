import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/globals/browser';
import type { TabId } from '@proton/pass/types';
import { isFailedRequest } from '@proton/pass/utils/requests';
import { parseUrl } from '@proton/pass/utils/url';

const filter: WebRequest.RequestFilter = {
    urls: ['<all_urls>'],
    types: ['xmlhttprequest'],
};

type TrackedRequestData = { tabId: TabId; domain: string };

type XMLHTTPRequestTrackerOptions = {
    acceptRequest: (request: WebRequest.OnBeforeRequestDetailsType) => boolean;
    onFailedRequest: (data: TrackedRequestData) => void;
};

export const createXMLHTTPRequestTracker = ({ acceptRequest, onFailedRequest }: XMLHTTPRequestTrackerOptions) => {
    const pendingRequests: Map<string, TrackedRequestData> = new Map();

    const onBeforeRequest = async (request: WebRequest.OnBeforeRequestDetailsType) => {
        const { tabId, requestId } = request;
        if (tabId >= 0 && acceptRequest(request)) {
            try {
                const tab = await browser.tabs.get(tabId);
                if (tab.url !== undefined) {
                    const { domain } = parseUrl(tab.url);
                    if (domain) pendingRequests.set(requestId, { tabId, domain });
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
            onFailedRequest(trackedRequest);
            pendingRequests.delete(requestId);
        }
    };

    browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, filter, ['requestBody']);
    browser.webRequest.onCompleted.addListener(onCompleted, filter);
    browser.webRequest.onErrorOccurred.addListener(onErrorOccured, filter);
};
