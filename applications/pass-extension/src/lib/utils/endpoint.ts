import type { Tabs } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types/utils/index';
import type { EndpointContext, FrameId } from '@proton/pass/types/worker/runtime';
import { parseUrl } from '@proton/pass/utils/url/parser';

export const resolveEndpointContext = async (tab: Maybe<Tabs.Tab>, frameId: FrameId): Promise<EndpointContext> => {
    if (tab?.id === undefined) throw new Error('Invalid sender tab');

    const tabUrl = parseUrl(tab.url);
    const tabId = tab.id;

    if (frameId > 0) {
        /** For sub-frames: resolve the iframe's document origin as the url */
        const result = await browser.webNavigation.getFrame({ frameId, tabId });
        if (!result) throw new Error('Invalid sender frame');
        const frameUrl = parseUrl(result.url);
        return { tabId, url: frameUrl, tabUrl, senderTabId: tabId, frameId };
    }

    /** For main frame: url and tabUrl are the same */
    return { tabId, senderTabId: tabId, url: tabUrl, tabUrl, frameId };
};
