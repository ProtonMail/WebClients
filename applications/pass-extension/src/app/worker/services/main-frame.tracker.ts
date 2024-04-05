import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { MaybeNull, TabId } from '@proton/pass/types';
import { isFailedRequest } from '@proton/pass/utils/requests';
import { parseUrl } from '@proton/pass/utils/url/parser';

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
    onTabDelete: (tabId: TabId) => void;
    onTabError: (tabId: TabId, domain: MaybeNull<string>) => void;
    onTabLoaded: (tabId: TabId, method: string, domain: MaybeNull<string>) => void;
};

const filter: WebRequest.RequestFilter = {
    urls: ['<all_urls>'],
    types: ['main_frame'],
};

export const createMainFrameRequestTracker = ({
    onTabDelete,
    onTabError,
    onTabLoaded,
}: MainFrameRequestTrackerOptions) => {
    const onMainFrameCompleted = (req: WebRequest.OnCompletedDetailsType) => {
        const domain = parseUrl(req.url).domain;
        if (isFailedRequest(req)) onTabError(req.tabId, domain);
        else onTabLoaded(req.tabId, req.method, domain);
    };

    browser.tabs.onRemoved.addListener(onTabDelete);
    browser.webRequest.onCompleted.addListener(onMainFrameCompleted, filter);
    browser.webRequest.onErrorOccurred.addListener(({ tabId, url }) => onTabError(tabId, parseUrl(url).domain), filter);

    return {};
};
