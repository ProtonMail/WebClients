import browser from '@proton/pass/globals/browser';
import {
    type SelectAutofillCandidatesOptions,
    itemAutofillIntent,
    itemUsed,
    selectAutofillCandidates,
    selectItemByShareIdAndId,
    selectPrimaryVault,
    selectVaultLimits,
} from '@proton/pass/store';
import type { Maybe, SafeLoginItem } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { parseSender, parseUrl } from '@proton/pass/utils/url';
import { workerReady } from '@proton/pass/utils/worker';
import noop from '@proton/utils/noop';

import { setPopupIconBadge } from '../../shared/extension';
import WorkerMessageBroker from '../channel';
import { onContextReady, withContext } from '../context';
import store from '../store';

export const createAutoFillService = () => {
    const getAutofillCandidates = (options: SelectAutofillCandidatesOptions): SafeLoginItem[] =>
        selectAutofillCandidates(options)(store.getState()).map((item) => ({
            name: item.data.metadata.name,
            username: item.data.content.username,
            itemId: item.itemId,
            shareId: item.shareId,
        }));

    const getAutofillData = ({
        shareId,
        itemId,
    }: {
        shareId: string;
        itemId: string;
    }): Maybe<{ username: string; password: string }> => {
        const state = store.getState();
        const item = selectItemByShareIdAndId(shareId, itemId)(state);

        if (item !== undefined && item.data.type === 'login') {
            store.dispatch(itemAutofillIntent({ shareId, itemId }));
            return {
                username: item.data.content.username,
                password: item.data.content.password,
            };
        }
    };

    const updateTabsBadgeCount = withContext(({ status }) => {
        if (!workerReady(status)) return;

        browser.tabs
            .query({ active: true })
            .then((tabs) =>
                Promise.all(
                    tabs.map(({ id: tabId, url }) => {
                        if (tabId) {
                            const items = getAutofillCandidates(parseUrl(url));
                            const primaryVaultId = selectPrimaryVault(store.getState()).shareId;
                            const { didDowngrade } = selectVaultLimits(store.getState());

                            /* if the user has downgraded : we want to keep the tab badge count
                             * with the total items matched, but sync the autofillable candidates
                             * in the content-scripts to be only the ones from the primary vault */
                            const count = items.length;
                            const safeCount = items.filter(
                                (item) => !didDowngrade || primaryVaultId === item.shareId
                            ).length;

                            WorkerMessageBroker.ports.broadcast(
                                {
                                    type: WorkerMessageType.AUTOFILL_SYNC,
                                    payload: { count: safeCount },
                                },
                                (name) => name.startsWith(`content-script-${tabId}`)
                            );

                            return setPopupIconBadge(tabId, count);
                        }
                    })
                )
            )
            .catch(noop);
    });

    /* Clears badge count for each valid tab
     * Triggered on logout detection to avoid
     * showing stale counts */
    const clearTabsBadgeCount = () => {
        browser.tabs
            .query({})
            .then((tabs) => Promise.all(tabs.map(({ id: tabId }) => tabId && setPopupIconBadge(tabId, 0))))
            .catch(noop);
    };

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_QUERY,
        onContextReady((_, sender) => {
            const { url, tabId } = parseSender(sender);
            const primaryVaultId = selectPrimaryVault(store.getState()).shareId;
            const { didDowngrade } = selectVaultLimits(store.getState());

            /* if user has exceeded his vault count limit - this likely means
             * has downgraded to a free plan : only allow him to autofill from
             * his primary vault */
            const items = getAutofillCandidates({
                ...url,
                ...(didDowngrade ? { shareId: primaryVaultId } : {}),
            });

            if (tabId) void setPopupIconBadge(tabId, items.length);

            return { items: tabId !== undefined && items.length > 0 ? items : [], needsUpgrade: didDowngrade };
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_SELECT,
        onContextReady(async (message) => {
            const credentials = getAutofillData(message.payload);

            if (credentials === undefined) {
                throw new Error('Could not get credentials for autofill request');
            }

            store.dispatch(itemUsed(message.payload));
            return credentials;
        })
    );

    /* onUpdated will be triggered every time a tab
     * has been loaded with a new url : update the
     * badge count accordingly */
    browser.tabs.onUpdated.addListener(
        onContextReady(async (tabId, _, tab) => {
            if (tabId) {
                const items = getAutofillCandidates(parseUrl(tab.url));
                return setPopupIconBadge(tabId, items.length);
            }
        })
    );

    return { getAutofillCandidates, updateTabsBadgeCount, clearTabsBadgeCount };
};

export type AutoFillService = ReturnType<typeof createAutoFillService>;
