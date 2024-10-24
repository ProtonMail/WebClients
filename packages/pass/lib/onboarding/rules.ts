import type { Store } from 'redux';

import { ITEM_COUNT_RATING_PROMPT, PASS_BF_2024_DATES } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import {
    selectCreatedItemsCount,
    selectFeatureFlag,
    selectLockEnabled,
    selectPassPlan,
    selectUserData,
    selectUserPlan,
    selectUserState,
} from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { OnboardingMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { merge } from '@proton/pass/utils/object/merge';
import { UNIX_DAY } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { createOnboardingRule } from './service';

export const createPendingShareAccessRule = (store: Store<State>) =>
    createOnboardingRule({
        message: OnboardingMessage.PENDING_SHARE_ACCESS,
        when: (previous) => {
            if (previous) return false;
            const state = store.getState();
            const { waitingNewUserInvites } = selectUserState(state);
            return (waitingNewUserInvites ?? 0) > 0;
        },
    });

export const createPermissionsRule = (checkPermissionsGranted: () => boolean) =>
    createOnboardingRule({
        message: OnboardingMessage.PERMISSIONS_REQUIRED,
        when: () => !checkPermissionsGranted(),
    });

export const createStorageIssueRule = (checkStorageFull: () => boolean) =>
    createOnboardingRule({
        message: OnboardingMessage.STORAGE_ISSUE,
        when: () => checkStorageFull(),
    });

export const createUpdateRule = (getAvailableUpdate: () => MaybeNull<string>) =>
    createOnboardingRule({
        message: OnboardingMessage.UPDATE_AVAILABLE,
        /* keep a reference to the current available update so as
         * not to re-prompt the user with this update if ignored */
        onAcknowledge: (ack) => merge(ack, { extraData: { version: getAvailableUpdate() } }),
        when: (previous) => {
            const availableVersion = getAvailableUpdate();
            const previousAckVersion = previous?.extraData?.version as MaybeNull<Maybe<string>>;
            const shouldPrompt = !previous || previousAckVersion !== availableVersion;

            return availableVersion !== null && shouldPrompt;
        },
    });

export const createTrialRule = (store: Store<State>) =>
    createOnboardingRule({
        message: OnboardingMessage.TRIAL,
        when: (previous) => {
            const passPlan = selectPassPlan(store.getState());
            return !previous && passPlan === UserPassPlan.TRIAL;
        },
    });

export const createB2BRule = (store: Store<State>) =>
    createOnboardingRule({
        message: OnboardingMessage.B2B_ONBOARDING,
        when: (previous) => {
            const passPlan = selectPassPlan(store.getState());
            return !previous && passPlan === UserPassPlan.BUSINESS;
        },
    });

export const createSecurityRule = (store: Store<State>) =>
    createOnboardingRule({
        message: OnboardingMessage.SECURE_EXTENSION,
        when: (previous, { installedOn }) => {
            /* should prompt only if user has no extension lock AND
             * message was not previously acknowledged AND user has
             * installed at least one day ago */
            const now = getEpoch();
            const lockEnabled = selectLockEnabled(store.getState());
            const shouldPrompt = !previous && now - installedOn > UNIX_DAY;

            return !lockEnabled && shouldPrompt;
        },
    });

export const createUserRatingRule = (store: Store<State>) =>
    createOnboardingRule({
        message: OnboardingMessage.USER_RATING,
        when: (previous) => {
            const createdItemsCount = selectCreatedItemsCount(store.getState());
            return !previous && createdItemsCount >= ITEM_COUNT_RATING_PROMPT;
        },
    });

export const createMonitorRule = () =>
    createOnboardingRule({
        message: OnboardingMessage.PASS_MONITOR,
        when: (previous) => !previous,
    });

export const createMonitorLearnMoreRule = () =>
    createOnboardingRule({
        message: OnboardingMessage.PASS_MONITOR_LEARN_MORE,
        onAcknowledge: (ack) => merge(ack, { extraData: { expanded: !ack.extraData?.expanded } }),
        when: (previous) => !previous || !previous.extraData?.expanded,
    });

export const createAliasTrashConfirmRule = () =>
    createOnboardingRule({
        message: OnboardingMessage.ALIAS_TRASH_CONFIRM,
        when: (previous) => !previous,
    });

export const createFamilyPlanPromo2024Rule = (store: Store<State>) =>
    createOnboardingRule({
        message: OnboardingMessage.FAMILY_PLAN_PROMO_2024,
        when: (previous) => {
            if (previous) return false;

            const state = store.getState();
            const enabled = selectFeatureFlag(PassFeature.PassFamilyPlanPromo2024)(state);
            const plan = selectUserPlan(state);
            const cohortPass2023 = plan?.InternalName === 'pass2023';
            const cohortPassFree = plan?.InternalName === 'free';

            return enabled && (cohortPass2023 || cohortPassFree);
        },
    });

export const createAliasSyncEnableRule = (store: Store<State>) =>
    createOnboardingRule({
        message: OnboardingMessage.ALIAS_SYNC_ENABLE,
        when: (previous) => {
            const state = store.getState();
            const enabled = selectFeatureFlag(PassFeature.PassSimpleLoginAliasesSync)(state);
            const { pendingAliasToSync } = selectUserData(state);

            return enabled && !previous && pendingAliasToSync > 0;
        },
    });

/* - Single message for both Lifetime and Family offers
 * - `extraData` stores the acknowledged feature flag
 * - Pass Family offer shown to free and pass2023 users
 * - Pass Unlimited offer shown to pass2023 users */
export const createBlackFriday2024Rule = (store: Store<State>) =>
    createOnboardingRule({
        message: OnboardingMessage.BLACK_FRIDAY_2024,
        onAcknowledge: (ack) => {
            /** FIXME: >= 1.25.0 - leverage `extraData` parameter
             * passed to `onAcknowledge` instead of inferring which
             * offer was acknowledged by the user */
            const state = store.getState();
            const plan = selectUserPlan(state);
            const lifetimeUpsell = selectFeatureFlag(PassFeature.PassBlackFriday2024Lifetime)(state);
            const lifeTimeAck = lifetimeUpsell && plan?.InternalName === 'pass2023';

            return {
                ...ack,
                extraData: lifeTimeAck
                    ? PassFeature.PassBlackFriday2024Lifetime
                    : PassFeature.PassBlackFriday2024Family,
            };
        },
        when: (previous) => {
            /* sanity check in-case feature flags are unreliable */
            const now = api.getState().serverTime?.getTime() ?? Date.now();
            if (now > PASS_BF_2024_DATES[1]) return false;

            const state = store.getState();
            const plan = selectUserPlan(state);
            const familyUpsell = selectFeatureFlag(PassFeature.PassBlackFriday2024Family)(state);
            const lifetimeUpsell = selectFeatureFlag(PassFeature.PassBlackFriday2024Lifetime)(state);

            switch (plan?.InternalName) {
                case 'pass2023':
                    if (lifetimeUpsell && previous?.extraData !== PassFeature.PassBlackFriday2024Lifetime) return true;
                    return !previous && familyUpsell;
                case 'free':
                    return !previous && familyUpsell;
                default:
                    return false;
            }
        },
    });
