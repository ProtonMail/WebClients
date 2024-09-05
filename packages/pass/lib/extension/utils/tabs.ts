import browser from '@proton/pass/lib/globals/browser';
import type { TabId } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';

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
