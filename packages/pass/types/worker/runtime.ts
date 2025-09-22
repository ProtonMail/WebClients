import type { Maybe } from '@proton/pass/types/utils';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

export type ClientEndpoint =
    | 'popup'
    | 'contentscript'
    | 'background'
    | 'page'
    | 'notification'
    | 'dropdown'
    | 'web'
    | 'desktop'
    | 'offscreen';

export type TabId = number;
export type TabInfo = { url: ParsedUrl; tabId: TabId; senderTabId?: TabId };
export type StatusCode = number;

export type WithTabId<T = {}> = T & { tabId: Maybe<TabId> };
