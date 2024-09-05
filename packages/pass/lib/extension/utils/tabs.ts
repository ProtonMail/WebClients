import type { Tabs } from 'webextension-polyfill';

import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import browser from '@proton/pass/lib/globals/browser';
import type { Maybe, TabId } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { truthy } from '@proton/pass/utils/fp/predicates';

/* We do not have access to the tabs API  in a content-script context */
export const getCurrentTab = async (): Promise<Maybe<Tabs.Tab>> => {
    try {
        return browser.tabs !== undefined
            ? first(await browser.tabs.query({ active: true, currentWindow: true }))
            : await new Promise((resolve) =>
                  sendMessage.onSuccess(contentScriptMessage({ type: WorkerMessageType.RESOLVE_TAB }), ({ tab }) =>
                      resolve(tab)
                  )
              );
    } catch (_) {}
};

export const filterDeletedTabIds = async (tabIds: TabId[]): Promise<TabId[]> =>
    (
        await Promise.all(
            tabIds.map(async (tabId) => {
                try {
                    const tab = await browser.tabs.get(tabId);
                    if (!tab) return tabId;
                } catch (_) {
                    return tabId;
                }
            })
        )
    ).filter(truthy);
