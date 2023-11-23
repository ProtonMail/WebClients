import { PASS_BF_2023_DATES } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import browser from '@proton/pass/lib/globals/browser';
import type {
    OnboardingAck,
    OnboardingRule,
    OnboardingStorageData,
    OnboardingWhen,
} from '@proton/pass/lib/onboarding/service';
import {
    createOnboardingService as createCoreOnboardingService,
    createOnboardingRule,
} from '@proton/pass/lib/onboarding/service';
import {
    selectFeatureFlag,
    selectHasRegisteredLock,
    selectPassPlan,
    selectUserState,
} from '@proton/pass/store/selectors';
import type { MaybeNull, Storage, TabId } from '@proton/pass/types';
import { OnboardingMessage, WorkerMessageType } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { withPayloadLens } from '@proton/pass/utils/fp/lens';
import { merge } from '@proton/pass/utils/object/merge';
import { UNIX_DAY } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import noop from '@proton/utils/noop';

import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import store from '../store';

/* Define the onboarding rules here :
 * - each rule must be registered on a specific `OnboardingMessage` type
 * - define an optional predicate for when to show the message
 * - order is important: we will apply the first matched rule */
const ONBOARDING_RULES: OnboardingRule[] = [
    createOnboardingRule({
        message: OnboardingMessage.PENDING_SHARE_ACCESS,
        when: (previous) => {
            if (previous) return false;
            const state = store.getState();
            const newUserSharingEnabled = selectFeatureFlag(PassFeature.PassSharingNewUsers)(state);
            const { waitingNewUserInvites } = selectUserState(state);
            return newUserSharingEnabled && (waitingNewUserInvites ?? 0) > 0;
        },
    }),
    createOnboardingRule({
        message: OnboardingMessage.PERMISSIONS_REQUIRED,
        when: withContext<OnboardingWhen>((ctx) => !ctx.service.activation.getPermissionsGranted()),
    }),
    createOnboardingRule({
        message: OnboardingMessage.STORAGE_ISSUE,
        when: withContext<OnboardingWhen>((ctx) => ctx.service.storage.getState().storageFull),
    }),
    createOnboardingRule({
        message: OnboardingMessage.UPDATE_AVAILABLE,
        /* keep a reference to the current available update so as
         * not to re-prompt the user with this update if ignored */
        onAcknowledge: withContext<OnboardingAck>((ctx, ack) =>
            merge(ack, { extraData: { version: ctx.service.activation.getAvailableUpdate() } })
        ),
        when: withContext<OnboardingWhen>((ctx, previous) => {
            const availableVersion = ctx.service.activation.getAvailableUpdate();
            const previousAckVersion = previous?.extraData?.version as MaybeNull<string>;
            const shouldPrompt = !previous || previousAckVersion !== availableVersion;

            return availableVersion !== null && shouldPrompt;
        }),
    }),
    createOnboardingRule({
        message: OnboardingMessage.BLACK_FRIDAY_OFFER,
        when: (previous) => {
            const passPlan = selectPassPlan(store.getState());
            if (passPlan === UserPassPlan.PLUS) return false;

            const now = api.getState().serverTime?.getTime() ?? Date.now();
            return !previous && now > PASS_BF_2023_DATES[0] && now < PASS_BF_2023_DATES[1];
        },
    }),
    createOnboardingRule({
        message: OnboardingMessage.TRIAL,
        when: (previous) => {
            const passPlan = selectPassPlan(store.getState());
            return !previous && passPlan === UserPassPlan.TRIAL;
        },
    }),
    createOnboardingRule({
        message: OnboardingMessage.SECURE_EXTENSION,
        when: (previous, { installedOn }) => {
            /* should prompt only if user has no extension lock AND
             * message was not previously acknowledged AND user has
             * installed at least one day ago */
            const now = getEpoch();
            const hasLock = selectHasRegisteredLock(store.getState());
            const shouldPrompt = !previous && now - installedOn > UNIX_DAY;

            return !hasLock && shouldPrompt;
        },
    }),
    createOnboardingRule({
        message: OnboardingMessage.USER_RATING,
        when: (previous) => {
            const PROMPT_ITEM_COUNT = 10;
            const { createdItemsCount } = store.getState().settings;
            return !previous && createdItemsCount >= PROMPT_ITEM_COUNT;
        },
    }),
];

export const createOnboardingService = (store: Storage<OnboardingStorageData>) => {
    const { acknowledge, init, setState, state } = createCoreOnboardingService({ store, rules: ONBOARDING_RULES });

    const onInstall = () => setState({ installedOn: getEpoch() });
    const onUpdate = () => setState({ updatedOn: getEpoch() });
    const reset = () => setState({ acknowledged: [] });

    /* Define extra rules in the `ONBOARDING_RULES` constant :
     * we will resolve the first message that matches the rule's
     * `when` condition */
    const getOnboardingMessage = () => ({
        message: ONBOARDING_RULES.find(
            ({ message, when }) =>
                when?.(
                    state.acknowledged.find((ack) => message === ack.message),
                    state
                )
        )?.message,
    });

    const navigateToOnboarding = async (tabId: TabId): Promise<boolean> => {
        const welcomePage = browser.runtime.getURL('/onboarding.html#/welcome');
        await browser.tabs.update(tabId, { url: welcomePage }).catch(noop);
        return true;
    };

    WorkerMessageBroker.registerMessage(WorkerMessageType.ONBOARDING_ACK, withPayloadLens('message', acknowledge));
    WorkerMessageBroker.registerMessage(WorkerMessageType.ONBOARDING_REQUEST, () => getOnboardingMessage());

    /* when reaching `account.proton.me/auth-ext` we want to
     * redirect the user to the welcome page iif user has logged in.
     * we check the `authStore` because the `ctx.state.loggedIn` will
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
