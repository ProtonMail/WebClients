import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/globals/browser';
import type { TabId } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object';
import { isFailedRequest, requestHasBodyFormData } from '@proton/pass/utils/requests';
import { parseUrl } from '@proton/pass/utils/url';

const filter: WebRequest.RequestFilter = {
    urls: ['<all_urls>'],
    types: ['xmlhttprequest'],
};

type XMLHTTPRequestTrackerOptions = {
    shouldTakeRequest: (tabId: TabId, domain: string) => boolean;
    onFailedRequest: (tabId: TabId, domain: string) => void;
};

export const createXMLHTTPRequestTracker = ({ shouldTakeRequest, onFailedRequest }: XMLHTTPRequestTrackerOptions) => {
    const pendingRequests: Map<string, WebRequest.OnBeforeRequestDetailsType & { domain: string }> = new Map();

    const onBeforeRequest = async (request: WebRequest.OnBeforeRequestDetailsType) => {
        const { tabId, requestId } = request;

        if (tabId >= 0 && requestHasBodyFormData(request)) {
            try {
                const tab = await browser.tabs.get(tabId);
                if (tab.url !== undefined) {
                    const { domain } = parseUrl(tab.url);
                    if (domain) pendingRequests.set(requestId, merge(request, { domain }));
                }
            } catch (_) {}
        }

        return {}; /* non-blocking */
    };

    const onCompleted = async (request: WebRequest.OnCompletedDetailsType) => {
        const { requestId, tabId } = request;
        const pending = pendingRequests.get(requestId);

        if (pending !== undefined) {
            if (isFailedRequest(request) && shouldTakeRequest(tabId, pending.domain)) {
                onFailedRequest(tabId, pending.domain);
            }

            pendingRequests.delete(requestId);
        }
    };

    const onErrorOccured = async (request: WebRequest.OnErrorOccurredDetailsType) => {
        const { requestId, tabId } = request;
        const pending = pendingRequests.get(requestId);

        if (pending !== undefined) {
            onFailedRequest(tabId, pending.domain);
            pendingRequests.delete(requestId);
        }
    };

    browser.webRequest.onBeforeRequest.addListener(onBeforeRequest, filter, ['requestBody']);
    browser.webRequest.onCompleted.addListener(onCompleted, filter);
    browser.webRequest.onErrorOccurred.addListener(onErrorOccured, filter);
};
