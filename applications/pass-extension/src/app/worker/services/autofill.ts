import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { onContextReady, withContext } from 'proton-pass-extension/app/worker/context';
import store from 'proton-pass-extension/app/worker/store';
import { setPopupIconBadge } from 'proton-pass-extension/lib/utils/popup-icon';
import { isContentScriptPort } from 'proton-pass-extension/lib/utils/port';

import { clientReady } from '@proton/pass/lib/client';
import browser from '@proton/pass/lib/globals/browser';
import { intoSafeLoginItem } from '@proton/pass/lib/items/item.utils';
import { DEFAULT_RANDOM_PW_OPTIONS } from '@proton/pass/lib/password/constants';
import type { SelectAutofillCandidatesOptions } from '@proton/pass/lib/search/types';
import { itemAutofilled } from '@proton/pass/store/actions';
import {
    selectAutofillCandidates,
    selectItem,
    selectPasswordOptions,
    selectVaultLimits,
    selectWritableVaults,
} from '@proton/pass/store/selectors';
import type { FormCredentials, ItemRevision, Maybe, SelectedItem } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { parseUrl } from '@proton/pass/utils/url/parser';
import noop from '@proton/utils/noop';

export const createAutoFillService = () => {
    const getCandidates = (options: SelectAutofillCandidatesOptions): ItemRevision<'login'>[] =>
        selectAutofillCandidates(options)(store.getState());

    const getAutofillData = ({ shareId, itemId }: SelectedItem): Maybe<FormCredentials> => {
        const state = store.getState();
        const item = selectItem(shareId, itemId)(state);

        if (item !== undefined && item.data.type === 'login') {
            store.dispatch(itemAutofilled({ shareId, itemId }));
            return {
                username: deobfuscate(item.data.content.username),
                password: deobfuscate(item.data.content.password),
            };
        }
    };

    const sync = withContext(({ status }) => {
        if (!clientReady(status)) return;

        browser.tabs
            .query({ active: true })
            .then((tabs) =>
                Promise.all(
                    tabs.map(({ id: tabId, url }) => {
                        if (tabId) {
                            const state = store.getState();
                            const items = getCandidates(parseUrl(url));
                            const writableShareIds = selectWritableVaults(state).map(prop('shareId'));
                            const { didDowngrade } = selectVaultLimits(state);

                            /* if the user has downgraded : we want to keep the tab badge count
                             * with the total items matched, but sync the autofillable candidates
                             * in the content-scripts to be only the ones from the writable vaults */
                            const safeItems = items
                                .filter((item) => !didDowngrade || writableShareIds.includes(item.shareId))
                                .map(intoSafeLoginItem);

                            WorkerMessageBroker.ports.broadcast(
                                {
                                    type: WorkerMessageType.AUTOFILL_SYNC,
                                    payload: { items: safeItems, needsUpgrade: didDowngrade },
                                },
                                isContentScriptPort(tabId)
                            );

                            return setPopupIconBadge(tabId, items.length);
                        }
                    })
                )
            )
            .catch(noop);
    });

    /* Clears badge count for each valid tab - Triggered on logout
     * detection to avoid showing stale counts */
    const clear = () => {
        browser.tabs
            .query({})
            .then((tabs) => Promise.all(tabs.map(({ id: tabId }) => tabId && setPopupIconBadge(tabId, 0))))
            .catch(noop);
    };

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_QUERY,
        onContextReady(({ getState }, { payload }, sender) => {
            if (!getState().loggedIn) return { items: [], needsUpgrade: false };

            const tabId = sender.tab?.id;
            const parsedUrl = parseUrl(payload.domain ?? sender.url!);

            const writableShareIds = selectWritableVaults(store.getState()).map(prop('shareId'));
            const { didDowngrade } = selectVaultLimits(store.getState());

            /* if user has exceeded his vault count limit - this likely means has downgraded
             * to a free plan : only allow him to autofill from his writable vaults */
            const items = getCandidates({ ...parsedUrl, shareIds: didDowngrade ? writableShareIds : undefined });
            if (tabId) void setPopupIconBadge(tabId, items.length);

            return {
                items: (tabId !== undefined && items.length > 0 ? items : []).map(intoSafeLoginItem),
                needsUpgrade: didDowngrade,
            };
        })
    );

    WorkerMessageBroker.registerMessage(WorkerMessageType.AUTOSUGGEST_PASSWORD_CONFIG, () => {
        return { config: selectPasswordOptions(store.getState()) ?? DEFAULT_RANDOM_PW_OPTIONS };
    });

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_SELECT,
        onContextReady(async (_, message) => {
            const credentials = getAutofillData(message.payload);
            if (credentials === undefined) throw new Error('Could not get credentials for autofill request');

            return credentials;
        })
    );

    /* onUpdated will be triggered every time a tab has been loaded with a new url :
     * update the badge count accordingly. `ensureReady` is used in place instead of
     * leveraging `onContextReady` to properly handle errors.  */
    browser.tabs.onUpdated.addListener(
        withContext(async (ctx, tabId, __, tab) => {
            try {
                await ctx.ensureReady();
                if (tabId) {
                    const items = getCandidates(parseUrl(tab.url));
                    await setPopupIconBadge(tabId, items.length);
                }
            } catch {}
        })
    );

    return { getCandidates, sync, clear };
};

export type AutoFillService = ReturnType<typeof createAutoFillService>;
