import type { Runtime } from 'webextension-polyfill';

import type { TabId } from '@proton/pass/types/worker/runtime';

/** Kept out of `mocks.ts`: the webextension-polyfill mock reads it, and must not load the whole store */
export let sender: Runtime.MessageSender;

export const setMockMessageSender = (url: string, tabId: TabId = -1, frameUrl = url, frameId = 0) =>
    (sender = {
        tab: { id: tabId, url },
        url: frameUrl,
        frameId,
    } as Runtime.MessageSender);
