import type { Tabs } from 'webextension-polyfill';

import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import browser from '@proton/pass/globals/browser';
import type { Maybe } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array';

/**
 * We do not have access to the tabs API
 * in a content-script context
 */
export const getCurrentTab = async (): Promise<Maybe<Tabs.Tab>> =>
    browser.tabs !== undefined
        ? first(await browser.tabs.query({ active: true, currentWindow: true }))
        : new Promise((resolve) =>
              sendMessage.onSuccess(contentScriptMessage({ type: WorkerMessageType.RESOLVE_TAB }), ({ tab }) =>
                  resolve(tab)
              )
          );
