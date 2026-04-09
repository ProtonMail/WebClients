import type { Runtime } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { FrameId, RequiredNonNull, TabId } from '@proton/pass/types';
import { parseUrl } from '@proton/pass/utils/url/parser';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

export type ParsedSenderUrl = RequiredNonNull<ParsedUrl, 'domain' | 'protocol'>;
export type ParsedSender = { tabId: TabId; url: ParsedSenderUrl; frameId: FrameId };

export const isSupportedSenderUrl = (parsedUrl: ParsedUrl): parsedUrl is ParsedSenderUrl =>
    parsedUrl.domain !== null && parsedUrl.protocol !== null;

/** Resolves a verified URL for the message sender. On non-Chromium
 * browsers: if available, uses the MessageSender origin property for
 * enhanced protection against compromised renderer spoofing */
export const parseSender = async (sender: Runtime.MessageSender): Promise<ParsedSender> => {
    const frameId = sender.frameId ?? 0;
    const tabId = sender.tab?.id;

    if (!tabId) throw new Error('[Sender] Unknown tab ID');

    const senderURL =
        (await (async () => {
            /** Origin of the page or frame that opened the connection. If the sender originated
             * from a frame, this may differ from the `url` property. [non-chromium only]
             * SEE: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender#origin */
            if ('origin' in sender) return sender.origin as string;
            if (frameId === 0) return sender.url;
            const frame = await browser.webNavigation.getFrame({ frameId, tabId });
            return frame?.url;
        })()) ?? '';

    const parsedUrl = parseUrl(senderURL);
    if (!isSupportedSenderUrl(parsedUrl)) throw new Error('[Sender] Unsupported sender');

    return { tabId, url: parsedUrl, frameId };
};
