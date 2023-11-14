import { PASS_BF_2023_DATES } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import browser from '@proton/pass/lib/globals/browser';
import {
    selectFeatureFlag,
    selectHasRegisteredLock,
    selectPassPlan,
    selectUserState,
} from '@proton/pass/store/selectors';
import type { MaybeNull, TabId } from '@proton/pass/types';
import {
    type Maybe,
    type OnboardingAcknowledgment,
    OnboardingMessage,
    type OnboardingState,
    WorkerMessageType,
} from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { withPayloadLens } from '@proton/pass/utils/fp/lens';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { UNIX_DAY } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';
import identity from '@proton/utils/identity';
import noop from '@proton/utils/noop';

import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import store from '../store';

type OnboardingContext = { state: OnboardingState };
type OnboardingWhen = (previousAck: Maybe<OnboardingAcknowledgment>, state: OnboardingState) => boolean;
type OnboardingOnAck = (ack: OnboardingAcknowledgment) => OnboardingAcknowledgment;
type OnboardingRule = { message: OnboardingMessage; when?: OnboardingWhen; onAcknowledge?: OnboardingOnAck };

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
    installedOn: -1,
    updatedOn: -1,
    acknowledged: [],
};

const createOnboardingRule = (options: OnboardingRule): OnboardingRule => ({
    message: options.message,
    onAcknowledge: options.onAcknowledge,
    when: (previousAck, state) =>
        options.when?.(previousAck, state) ?? !state.acknowledged.some((data) => data.message === options.message),
});

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
        onAcknowledge: withContext<OnboardingOnAck>((ctx, ack) => {
            /* keep a reference to the current available update so as
             * not to re-prompt the user with this update if ignored */
            return merge(ack, {
                extraData: {
                    version: ctx.service.activation.getAvailableUpdate(),
                },
            });
        }),
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

export const createOnboardingService = () => {
    const ctx: OnboardingContext = { state: INITIAL_ONBOARDING_STATE };

    /* Every setState call will have the side-effect of
     * updating the locally stored onboarding state  */
    const setState = withContext<(state: Partial<OnboardingState>) => void>(({ service }, state) => {
        ctx.state = merge(ctx.state, state);
        void service.storage.local.set({ onboarding: JSON.stringify(ctx.state) });
    });

    const onInstall = () => setState({ installedOn: getEpoch() });
    const onUpdate = () => setState({ updatedOn: getEpoch() });

    /* Reset the state's acknowledged messages. This may be
     * useful when logging out a user - preserves timestamps */
    const reset = () => setState({ acknowledged: [] });

    /* Acknowledges the current onboarding message by either pushing
     * it to the acknowledged messages list or updating the entry */
    const acknowledge = (message: OnboardingMessage) => {
        logger.info(`[Worker::Onboarding] Acknowledging "${OnboardingMessage[message]}"`);
        const acknowledged = ctx.state.acknowledged.find((data) => data.message === message);
        const onAcknowledge = ONBOARDING_RULES.find((rule) => rule.message === message)?.onAcknowledge ?? identity;

        setState({
            acknowledged: [
                ...ctx.state.acknowledged.filter((data) => data.message !== message),
                onAcknowledge({ message, acknowledgedOn: getEpoch(), count: (acknowledged?.count ?? 0) + 1 }),
            ],
        });

        return true;
    };

    /* Define extra rules in the `ONBOARDING_RULES` constant :
     * we will resolve the first message that matches the rule's
     * `when` condition */
    const getOnboardingMessage = () => ({
        message: ONBOARDING_RULES.find(
            ({ message, when }) =>
                when?.(
                    ctx.state.acknowledged.find((ack) => message === ack.message),
                    ctx.state
                )
        )?.message,
    });

    const navigateToOnboarding = async (tabId: TabId): Promise<boolean> => {
        const welcomePage = browser.runtime.getURL('/onboarding.html#/welcome');
        await browser.tabs.update(tabId, { url: welcomePage }).catch(noop);
        return true;
    };

    /* hydrate the onboarding state value from the storage
     * on service creation. This will noop on first install */
    const hydrate = withContext(async ({ service }) => {
        try {
            const { onboarding } = await service.storage.local.get(['onboarding']);
            if (onboarding) setState(JSON.parse(onboarding));
        } catch {}
    });

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

    return { hydrate, reset, onInstall, onUpdate };
};

export type OnboardingService = ReturnType<typeof createOnboardingService>;
