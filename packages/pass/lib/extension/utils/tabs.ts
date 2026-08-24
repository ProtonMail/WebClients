import type { TabId } from '../../../types';
import { truthy } from '../../../utils/fp/predicates';
import browser from '../../globals/browser';

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
