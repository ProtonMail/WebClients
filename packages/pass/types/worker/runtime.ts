import type { ParsedUrl } from '@proton/pass/utils/url/types';

export type TabId = number;
export type TabInfo = { url: ParsedUrl; tabId: TabId };
export type StatusCode = number;
