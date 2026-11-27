import type { ParsedUrl } from '@proton/pass/lib/urls/types';
import { domainFallbackAutosaveSiteName } from '@proton/pass/lib/urls/utils/autosave-domain-fallback';
import { PassFeature } from '@proton/pass/types/api/features';
import type { MaybeNull } from '@proton/pass/types/utils';
import type { TabId } from '@proton/pass/types/worker/runtime';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { WorkerContextInterface } from '../../app/worker/context/types';
import { WorkerMessageType } from '../../types/messages';
import { backgroundMessage, sendTabMessage } from '../message/send-message';

/** Bound how long popup init waits on the tab's main thread for page metadata. */
const RESOLVE_DEFAULT_ITEM_NAME_TIMEOUT_MS = 150;

export const resolveDefaultItemNameForTab = async (
    ctx: WorkerContextInterface,
    tabId: TabId,
    tabUrl: ParsedUrl
): Promise<MaybeNull<string>> => {
    try {
        const { features } = await ctx.service.featureFlags.resolve();
        if (!features[PassFeature.PassAutosaveSiteName]) return null;

        const pageUrl = tabUrl.cleanUrl ?? tabUrl.url;
        if (!pageUrl) return null;

        const tabResponse = await Promise.race([
            sendTabMessage(backgroundMessage({ type: WorkerMessageType.RESOLVE_DEFAULT_ITEM_NAME }), {
                tabId,
                frameId: 0,
            }).catch(() => null),
            wait(RESOLVE_DEFAULT_ITEM_NAME_TIMEOUT_MS).then(() => null),
        ]);

        if (tabResponse?.defaultItemName) return tabResponse.defaultItemName;

        return domainFallbackAutosaveSiteName(pageUrl);
    } catch {
        return null;
    }
};
