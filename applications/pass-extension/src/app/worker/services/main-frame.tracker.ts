import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { TabId } from '@proton/pass/types';
import { isFailedRequest } from '@proton/pass/utils/requests';
import { parseUrl } from '@proton/pass/utils/url/parser';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

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
    onTabError: (tabId: TabId, url: ParsedUrl) => void;
    onTabLoaded: (tabId: TabId, method: string, url: ParsedUrl) => void;
    onTabUpdate: (tabId: TabId) => void;
};

const filter: WebRequest.RequestFilter = {
    urls: ['<all_urls>'],
    types: ['main_frame'],
};

export const createMainFrameRequestTracker = ({
    onTabDelete,
    onTabError,
    onTabLoaded,
    onTabUpdate,
}: MainFrameRequestTrackerOptions) => {
    const onMainFrameCompleted = (req: WebRequest.OnCompletedDetailsType) => {
        onTabUpdate(req.tabId);
        const url = parseUrl(req.url);
        if (isFailedRequest(req)) onTabError(req.tabId, url);
        else onTabLoaded(req.tabId, req.method, url);
    };

    const onMainFrameDeleted = (tabId: TabId) => {
        onTabUpdate(tabId);
        onTabDelete(tabId);
    };

    browser.tabs.onRemoved.addListener(onMainFrameDeleted);
    if (BUILD_TARGET !== 'safari') browser.webRequest.onCompleted.addListener(onMainFrameCompleted, filter);

    return {};
};
