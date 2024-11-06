import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import type { Store } from 'redux';

import browser from '@proton/pass/lib/globals/browser';
import {
    createAliasSyncEnableRule,
    createAliasTrashConfirmRule,
    createBlackFriday2024Rule,
    createMonitorRule,
    createPendingShareAccessRule,
    createPermissionsRule,
    createSecurityRule,
    createStorageIssueRule,
    createTrialRule,
    createUpdateRule,
    createUserRatingRule,
    createUserRenewalRule,
} from '@proton/pass/lib/spotlight/rules';
import { createSpotlightService as createCoreSpotlightService } from '@proton/pass/lib/spotlight/service';
import type { State } from '@proton/pass/store/types';
import type { ExtensionStorage, TabId } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { withPayloadLens } from '@proton/pass/utils/fp/lens';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

export const createSpotlightService = (
    storage: ExtensionStorage<Record<'onboarding', string>>,
    store: Store<State>
) => {
    const { acknowledge, init, setState, getMessage, checkMessage } = createCoreSpotlightService({
        getStorageKey: () => 'onboarding',
        storage,
        rules: [
            /* The order below defines the priority for spotlight display (first rule with `when` returning `true`).
             * Rules displayed as spotlight should be defined above the "invisible" rules
             * otherwise they may never be displayed, as an "invisible" rule may return `true` first */
            createPendingShareAccessRule(store),
            createPermissionsRule(withContext((ctx) => ctx.service.activation.getPermissionsGranted())),
            createStorageIssueRule(withContext((ctx) => ctx.service.storage.getState().storageFull)),
            createUpdateRule(withContext((ctx) => ctx.service.activation.getAvailableUpdate())),
            createTrialRule(store),
            ...(BUILD_TARGET !== 'safari' ? [createBlackFriday2024Rule(store)] : []),
            createSecurityRule(store),
            createUserRatingRule(store),
            createUserRenewalRule(store),
            createAliasSyncEnableRule(store),

            /* "Invisible" rules not displayed as spotlight should be defined at the bottom */
            createMonitorRule(),
            createAliasTrashConfirmRule(),
        ],
    });

    const onInstall = () => setState({ installedOn: getEpoch() });
    const onUpdate = () => setState({ updatedOn: getEpoch() });
    const reset = () => setState({ acknowledged: [] });

    const navigateToOnboarding = async (tabId: TabId): Promise<boolean> => {
        const welcomePage = browser.runtime.getURL('/onboarding.html#/welcome');
        await browser.tabs.update(tabId, { url: welcomePage }).catch(noop);
        return true;
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.SPOTLIGHT_ACK, withPayloadLens('message', acknowledge));
    WorkerMessageBroker.registerMessage(WorkerMessageType.SPOTLIGHT_CHECK, withPayloadLens('message', checkMessage));
    WorkerMessageBroker.registerMessage(WorkerMessageType.SPOTLIGHT_REQUEST, getMessage);

    /* when reaching `account.proton.me/auth-ext` we want to
     * redirect the user to the welcome page iif user has logged in.
     * we check the `authStore` because the `ctx.state.authorized` will
     * not be `true` until the worker is actually `READY` (booting
     * sequence finished) */
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.ACCOUNT_EXTENSION,
        withContext((ctx, _, { tab }) => (ctx.authStore.hasSession() && tab?.id ? navigateToOnboarding(tab.id) : false))
    );

    /* used by account to redirect to the onboarding welcome page
     * without user being necessarily logged in */
    WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_ONBOARDING, (_, { tab }) =>
        tab?.id ? navigateToOnboarding(tab.id) : false
    );

    return { init, reset, onInstall, onUpdate };
};

export type SpotlightService = ReturnType<typeof createSpotlightService>;
