import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { onContextReady, withContext } from 'proton-pass-extension/app/worker/context/inject';
import type { MessageHandlerCallback } from 'proton-pass-extension/lib/message/message-broker';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { setPopupIconBadge } from 'proton-pass-extension/lib/utils/popup';
import { isContentScriptPort } from 'proton-pass-extension/lib/utils/port';
import type { AutofillCheckFormMessage, WorkerMessageResponse } from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { clientReady } from '@proton/pass/lib/client';
import { getRulesForURL, parseRules } from '@proton/pass/lib/extension/utils/website-rules';
import browser from '@proton/pass/lib/globals/browser';
import { intoIdentityItemPreview, intoLoginItemPreview, intoUserIdentifier } from '@proton/pass/lib/items/item.utils';
import { DEFAULT_RANDOM_PW_OPTIONS } from '@proton/pass/lib/password/constants';
import type { SelectAutofillCandidatesOptions } from '@proton/pass/lib/search/types';
import { itemAutofilled } from '@proton/pass/store/actions';
import { getInitialSettings } from '@proton/pass/store/reducers/settings';
import {
    selectAutofillIdentityCandidates,
    selectAutofillLoginCandidates,
    selectAutofillableShareIDs,
    selectAutosuggestCopyToClipboard,
    selectItem,
    selectOrganizationPasswordGeneratorPolicy,
    selectPasswordOptions,
    selectVaultLimits,
} from '@proton/pass/store/selectors';
import type { FormCredentials, ItemContent, ItemRevision, Maybe, SelectedItem, TabId } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { parseUrl } from '@proton/pass/utils/url/parser';
import noop from '@proton/utils/noop';

export const createAutoFillService = () => {
    const attemptedBasicAuthRequests = new Map<string, number>();

    const getLoginCandidates = withContext<(options: SelectAutofillCandidatesOptions) => ItemRevision<'login'>[]>(
        (ctx, options) => selectAutofillLoginCandidates(options)(ctx.service.store.getState())
    );

    const getCredentials = withContext<(item: SelectedItem) => Maybe<FormCredentials>>((ctx, { shareId, itemId }) => {
        const state = ctx.service.store.getState();
        const item = selectItem<'login'>(shareId, itemId)(state);

        if (item?.data.type === 'login') {
            ctx.service.store.dispatch(itemAutofilled({ shareId, itemId }));
            return {
                /** For autofill we use the username if not empty, otherwise the email */
                userIdentifier: intoUserIdentifier(item),
                password: deobfuscate(item.data.content.password),
            };
        }
    });

    const getIdentity = withContext<(item: SelectedItem) => Maybe<ItemContent<'identity'>>>(
        (ctx, { shareId, itemId }) => {
            const state = ctx.service.store.getState();
            const item = selectItem<'identity'>(shareId, itemId)(state);

            if (item?.data.type === 'identity') {
                ctx.service.store.dispatch(itemAutofilled({ shareId, itemId }));
                return item.data.content;
            }
        }
    );

    const getAutofillOptions = withContext<
        (writableOnly?: boolean) => { needsUpgrade: boolean; shareIds: Maybe<string[]> }
    >((ctx, writableOnly) => {
        const state = ctx.service.store.getState();
        const shareIds = selectAutofillableShareIDs(state, writableOnly);
        const needsUpgrade = selectVaultLimits(state).didDowngrade;

        return { needsUpgrade, shareIds };
    });

    const sync = withContext(({ status }) => {
        if (!clientReady(status)) return;

        browser.tabs
            .query({ active: true })
            .then((tabs) =>
                Promise.all(
                    tabs.map(({ id: tabId, url }) => {
                        if (tabId) {
                            const items = getLoginCandidates(parseUrl(url));
                            setPopupIconBadge(tabId, items.length).catch(noop);

                            WorkerMessageBroker.ports.broadcast({ type: WorkerMessageType.AUTOFILL_SYNC }, (name) =>
                                isContentScriptPort(name, tabId)
                            );
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

    const queryTabLoginForms = async (tabID: TabId): Promise<boolean> => {
        try {
            return (
                (
                    await browser.tabs.sendMessage<
                        AutofillCheckFormMessage,
                        WorkerMessageResponse<WorkerMessageType.AUTOFILL_CHECK_FORM>
                    >(tabID, backgroundMessage({ type: WorkerMessageType.AUTOFILL_CHECK_FORM }))
                )?.hasLoginForm ?? false
            );
        } catch (err) {
            return false;
        }
    };

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_LOGIN_QUERY,
        onContextReady(async ({ getState }, { payload }, sender) => {
            const tabId = sender.tab?.id;
            if (!getState().authorized || tabId === undefined) throw new Error('Invalid autofill query');

            const host = await (async () => {
                if (payload.domain) return payload.domain;
                if (tabId) return (await browser.tabs.get(tabId))?.url;
                else throw new Error('');
            })();

            const parsedUrl = parseUrl(host);
            const { shareIds, needsUpgrade } = getAutofillOptions(payload.writable);

            const items = getLoginCandidates({ ...parsedUrl, shareIds }).map(intoLoginItemPreview);
            if (tabId) void setPopupIconBadge(tabId, items.length);
            return { items, needsUpgrade };
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_IDENTITY_QUERY,
        onContextReady(async (ctx, _, sender) => {
            const tabId = sender.tab?.id;
            if (!ctx.getState().authorized || tabId === undefined) throw new Error('Invalid autofill query');

            const state = ctx.service.store.getState();
            const { shareIds, needsUpgrade } = getAutofillOptions();
            const items = selectAutofillIdentityCandidates(shareIds)(state).map(intoIdentityItemPreview);

            return { items, needsUpgrade };
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOSUGGEST_PASSWORD,
        withContext((ctx) => {
            const state = ctx.service.store.getState();
            return {
                config: selectPasswordOptions(state) ?? DEFAULT_RANDOM_PW_OPTIONS,
                copy: selectAutosuggestCopyToClipboard(state) ?? getInitialSettings().autosuggest.passwordCopy,
                policy: selectOrganizationPasswordGeneratorPolicy(state),
            };
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_LOGIN,
        onContextReady(async (_, message) => {
            const credentials = getCredentials(message.payload);
            if (!credentials) throw new Error('Could not get credentials for autofill request');
            return credentials;
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.AUTOFILL_IDENTITY,
        onContextReady(async (_, message) => {
            const identity = getIdentity(message.payload);
            if (!identity) throw new Error('Could not get identity for autofill request');
            return identity;
        })
    );

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.WEBSITE_RULES_REQUEST,
        withContext<MessageHandlerCallback<WorkerMessageType.WEBSITE_RULES_REQUEST>>(async (ctx, _, sender) => {
            const rules = parseRules(await ctx.service.storage.local.getItem('websiteRules'));
            if (!(rules && sender.url)) return { rules: null };

            return { rules: getRulesForURL(rules, new URL(sender.url)) };
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
                    const items = getLoginCandidates(parseUrl(tab.url));
                    await setPopupIconBadge(tabId, items.length);
                }
            } catch {}
        })
    );

    browser.webRequest.onAuthRequired.addListener(
        (details) => {
            const items = getLoginCandidates(parseUrl(details.url));

            // If there are no items, do nothing
            if (!items.length) return { cancel: false };

            // If url already has the credentials embedded, do nothing
            if (/:\/\/(.)+:(.)+@/.test(details.url)) return { cancel: false };

            // Mechanism to prevent infinite loop when credentials are incorrect
            const requestAttempt = attemptedBasicAuthRequests.get(details.requestId) ?? 0;
            if (requestAttempt >= items.length) return { cancel: false };

            attemptedBasicAuthRequests.set(details.requestId, requestAttempt + 1);

            // Clear the Map after 2 seconds
            setTimeout(() => attemptedBasicAuthRequests.delete(details.requestId), 2000);

            // If there are more than 1 login credentials, try with each one
            const item = items[requestAttempt];

            return {
                authCredentials: {
                    username: intoUserIdentifier(item),
                    password: deobfuscate(item.data.content.password),
                },
            };
        },
        { urls: ['<all_urls>'] },
        ['blocking']
    );

    return {
        clear,
        getLoginCandidates,
        queryTabLoginForms,
        sync,
    };
};

export type AutoFillService = ReturnType<typeof createAutoFillService>;
