import type { Store } from 'redux';

import { ITEM_COUNT_RATING_PROMPT, PASS_BF_2024_DATES } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import {
    selectCreatedItemsCount,
    selectFeatureFlag,
    selectInAppNotificationsEnabled,
    selectLockEnabled,
    selectPassPlan,
    selectUserData,
    selectUserPlan,
    selectUserState,
} from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import { type Maybe, type MaybeNull, PlanType, SpotlightMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { merge } from '@proton/pass/utils/object/merge';
import { UNIX_DAY, UNIX_MONTH, UNIX_WEEK } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { createSpotlightRule } from './service';

export const createPendingShareAccessRule = (store: Store<State>) =>
    createSpotlightRule({
        message: SpotlightMessage.PENDING_SHARE_ACCESS,
        when: (previous) => {
            if (previous) return false;
            const state = store.getState();
            const { waitingNewUserInvites } = selectUserState(state);
            return (waitingNewUserInvites ?? 0) > 0;
        },
    });

export const createWelcomeRule = () =>
    createSpotlightRule({
        message: SpotlightMessage.WELCOME,
        when: (previous) => {
            if (!DESKTOP_BUILD) return false;
            return !previous;
        },
    });

export const createPermissionsRule = (checkPermissionsGranted: () => boolean) =>
    createSpotlightRule({
        message: SpotlightMessage.PERMISSIONS_REQUIRED,
        when: () => !checkPermissionsGranted(),
    });

export const createStorageIssueRule = (checkStorageFull: () => boolean) =>
    createSpotlightRule({
        message: SpotlightMessage.STORAGE_ISSUE,
        when: () => checkStorageFull(),
    });

export const createUpdateRule = (getAvailableUpdate: () => MaybeNull<string>) =>
    createSpotlightRule({
        message: SpotlightMessage.UPDATE_AVAILABLE,
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
    createSpotlightRule({
        message: SpotlightMessage.TRIAL,
        when: (previous) => {
            const passPlan = selectPassPlan(store.getState());
            return !previous && passPlan === UserPassPlan.TRIAL;
        },
    });

export const createB2BRule = (store: Store<State>) =>
    createSpotlightRule({
        message: SpotlightMessage.B2B_ONBOARDING,
        when: (previous) => {
            const passPlan = selectPassPlan(store.getState());
            return !previous && passPlan === UserPassPlan.BUSINESS;
        },
    });

export const createSecurityRule = (store: Store<State>) =>
    createSpotlightRule({
        message: SpotlightMessage.SECURE_EXTENSION,
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
    createSpotlightRule({
        message: SpotlightMessage.USER_RATING,
        when: (previous) => {
            const createdItemsCount = selectCreatedItemsCount(store.getState());
            return !previous && createdItemsCount >= ITEM_COUNT_RATING_PROMPT;
        },
    });

export const createMonitorRule = () =>
    createSpotlightRule({
        message: SpotlightMessage.PASS_MONITOR,
        when: (previous) => !previous,
    });

export const createMonitorLearnMoreRule = () =>
    createSpotlightRule({
        message: SpotlightMessage.PASS_MONITOR_LEARN_MORE,
        onAcknowledge: (ack) => merge(ack, { extraData: { expanded: !ack.extraData?.expanded } }),
        when: (previous) => !previous || !previous.extraData?.expanded,
    });

export const createAliasTrashConfirmRule = () =>
    createSpotlightRule({
        message: SpotlightMessage.ALIAS_TRASH_CONFIRM,
        when: (previous) => !previous,
    });

export const createFamilyPlanPromo2024Rule = (store: Store<State>) =>
    createSpotlightRule({
        message: SpotlightMessage.FAMILY_PLAN_PROMO_2024,
        when: (previous) => {
            if (previous) return false;

            const state = store.getState();
            if (!selectInAppNotificationsEnabled(state)) return false;

            const enabled = selectFeatureFlag(PassFeature.PassFamilyPlanPromo2024)(state);
            const plan = selectUserPlan(state);
            const cohortPass2023 = plan?.InternalName === 'pass2023';
            const cohortPassFree = plan?.InternalName === 'free';

            return enabled && (cohortPass2023 || cohortPassFree);
        },
    });

export const createAliasSyncEnableRule = (store: Store<State>) =>
    createSpotlightRule({
        message: SpotlightMessage.ALIAS_SYNC_ENABLE,
        when: (previous) => {
            const state = store.getState();
            const enabled = selectFeatureFlag(PassFeature.PassSimpleLoginAliasesSync)(state);
            const { pendingAliasToSync } = selectUserData(state);

            return enabled && !previous && pendingAliasToSync > 0;
        },
    });

/* - Pass Family offer shown to pass2023 users
 * - Pass Lifetime offer shown to free users */
export const createBlackFriday2024Rule = (store: Store<State>) =>
    createSpotlightRule({
        message: SpotlightMessage.BLACK_FRIDAY_2024,
        when: (previous) => {
            const state = store.getState();
            if (!selectInAppNotificationsEnabled(state)) return false;

            /* sanity check in-case feature flags are unreliable */
            const now = api.getState().serverTime?.getTime() ?? Date.now();
            if (now > PASS_BF_2024_DATES[1]) return false;

            switch (selectUserPlan(state)?.InternalName) {
                case 'pass2023':
                    return !previous && selectFeatureFlag(PassFeature.PassBlackFriday2024Family)(state);
                case 'free':
                    return !previous && selectFeatureFlag(PassFeature.PassBlackFriday2024Lifetime)(state);
                default:
                    return false;
            }
        },
    });

export const createUserRenewalRule = (store: Store<State>) =>
    createSpotlightRule({
        message: SpotlightMessage.USER_RENEWAL,
        when: (previous) => {
            const plan = selectUserPlan(store.getState());

            // Do not show if it's not a Plus plan or can't manage subscription or is already renewing
            if (plan?.Type !== PlanType.plus || !plan?.ManageSubscription || plan?.SubscriptionRenewal) return false;

            const now = getEpoch();

            // If acknowledged, show it again after two weeks
            if (previous) return now - previous.acknowledgedOn > UNIX_WEEK * 2;

            const subscriptionEnd = plan?.SubscriptionEnd ?? 0;

            // Prevent showing the banner if the plan type has not been
            // updated to 'Free' after the subscription date has passed
            if (subscriptionEnd > now) return false;

            return subscriptionEnd - now < UNIX_MONTH;
        },
    });
