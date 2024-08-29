import browser from '@proton/pass/lib/globals/browser';
import {
    createAliasTrashConfirmRule,
    createBlackFridayRule,
    createMonitorRule,
    createPendingShareAccessRule,
    createPermissionsRule,
    createSecurityRule,
    createStorageIssueRule,
    createTrialRule,
    createUpdateRule,
    createUserRatingRule,
} from '@proton/pass/lib/onboarding/rules';
import type { OnboardingStorageData } from '@proton/pass/lib/onboarding/service';
import { createOnboardingService as createCoreOnboardingService } from '@proton/pass/lib/onboarding/service';
import type { ExtensionStorage, TabId } from '@proton/pass/types';
import { WorkerMessageType } from '@proton/pass/types';
import { withPayloadLens } from '@proton/pass/utils/fp/lens';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import store from '../store';

export const createOnboardingService = (storage: ExtensionStorage<OnboardingStorageData>) => {
    const { acknowledge, init, setState, getMessage, checkMessage } = createCoreOnboardingService({
        storage,
        rules: [
            createPendingShareAccessRule(store),
            createPermissionsRule(withContext((ctx) => ctx.service.activation.getPermissionsGranted())),
            createStorageIssueRule(withContext((ctx) => ctx.service.storage.getState().storageFull)),
            createUpdateRule(withContext((ctx) => ctx.service.activation.getAvailableUpdate())),
            createTrialRule(store),
            createBlackFridayRule(store),
            createSecurityRule(store),
            createUserRatingRule(store),
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

    WorkerMessageBroker.registerMessage(WorkerMessageType.ONBOARDING_ACK, withPayloadLens('message', acknowledge));
    WorkerMessageBroker.registerMessage(WorkerMessageType.ONBOARDING_CHECK, withPayloadLens('message', checkMessage));
    WorkerMessageBroker.registerMessage(WorkerMessageType.ONBOARDING_REQUEST, getMessage);

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

export type OnboardingService = ReturnType<typeof createOnboardingService>;
