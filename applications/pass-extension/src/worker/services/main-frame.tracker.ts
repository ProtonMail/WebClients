import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/globals/browser';
import type { MaybeNull, TabId } from '@proton/pass/types';
import { isFailedRequest } from '@proton/pass/utils/requests';
import { parseUrl } from '@proton/pass/utils/url';

/**
 * There is currently no way to retrieve the status
 * code of a main frame request in the browser
 * javascript API.
 *
 * After a form submission triggering a page change,
 * in order to infer a potential failure from a
 * redirection to an unauthorized page, we keep track
 * of the active's tabs statuses.
 */
type MainFrameRequestTrackerOptions = {
    onTabError: (tabId: TabId, domain: MaybeNull<string>) => void;
    onTabDelete: (tabId: TabId) => void;
};

const filter: WebRequest.RequestFilter = {
    urls: ['<all_urls>'],
    types: ['main_frame'],
};

export const createMainFrameRequestTracker = ({ onTabDelete, onTabError }: MainFrameRequestTrackerOptions) => {
    const onMainFrameCompleted = (req: WebRequest.OnCompletedDetailsType) =>
        isFailedRequest(req) && onTabError(req.tabId, parseUrl(req.url).domain);

    browser.tabs.onRemoved.addListener(onTabDelete);
    browser.webRequest.onCompleted.addListener(onMainFrameCompleted, filter);
    browser.webRequest.onErrorOccurred.addListener(({ tabId, url }) => onTabError(tabId, parseUrl(url).domain), filter);

    return {};
};
