import type { Store } from 'redux';

import { ITEM_COUNT_RATING_PROMPT } from '@proton/pass/constants';
import { hasAttachments, hasHadAttachments } from '@proton/pass/lib/items/item.predicates';
import { isPaidPlan } from '@proton/pass/lib/user/user.predicates';
import {
    selectAliasItems,
    selectAllItems,
    selectCanCreateItems,
    selectCreatedItemsCount,
    selectHasPendingShareAccess,
    selectLockEnabled,
    selectPassPlan,
    selectUserData,
    selectUserPlan,
} from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import { type Maybe, type MaybeNull, PlanType, SpotlightMessage } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { or } from '@proton/pass/utils/fp/predicates';
import { merge } from '@proton/pass/utils/object/merge';
import { UNIX_DAY, UNIX_MONTH, UNIX_WEEK } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { type SpotlightRule, createSpotlightRule } from './service';

export const createPendingShareAccessRule = (store: Store<State>) =>
    createSpotlightRule({
        message: SpotlightMessage.PENDING_SHARE_ACCESS,
        when: (previous) => {
            if (previous) return false;
            const state = store.getState();
            return selectHasPendingShareAccess(state);
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

export const createWebOnboardingRule = () =>
    createSpotlightRule({
        message: SpotlightMessage.WEB_ONBOARDING,
        when: (previous) => !DESKTOP_BUILD && !previous,
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

export const createMonitorLearnMoreRule = () =>
    createSpotlightRule({
        message: SpotlightMessage.PASS_MONITOR_LEARN_MORE,
        onAcknowledge: (ack) => merge(ack, { extraData: { expanded: !ack.extraData?.expanded } }),
        when: (previous) => !previous || !previous.extraData?.expanded,
    });

export const createAliasSyncEnableRule = (store: Store<State>) =>
    createSpotlightRule({
        message: SpotlightMessage.ALIAS_SYNC_ENABLE,
        when: (previous) => {
            const state = store.getState();
            const { aliasSyncEnabled, pendingAliasToSync } = selectUserData(state);
            const canCreateItems = selectCanCreateItems(state);

            return !previous && !aliasSyncEnabled && pendingAliasToSync > 0 && canCreateItems;
        },
    });

export const createUserRenewalRule = (store: Store<State>) =>
    createSpotlightRule({
        message: SpotlightMessage.USER_RENEWAL,
        when: (previous) => {
            const plan = selectUserPlan(store.getState());

            // Do not show if it's not a Plus plan or can't manage subscription or is already renewing
            if (plan?.Type !== PlanType.PLUS || !plan?.ManageSubscription || plan?.SubscriptionRenewal) return false;

            const now = getEpoch();

            // If acknowledged, show it again after two weeks
            if (previous) return now - previous.acknowledgedOn > UNIX_WEEK * 2;

            const subscriptionEnd = plan?.SubscriptionEnd ?? 0;

            // Prevent showing the banner if the plan type has not been
            // updated to 'Free' after the subscription date has passed
            if (subscriptionEnd < now) return false;

            return subscriptionEnd - now < UNIX_MONTH;
        },
    });

export const createSSOChangeLockRule = () =>
    createSpotlightRule({
        message: SpotlightMessage.SSO_CHANGE_LOCK,
        when: (previous) => !previous,
    });

export const createItemSharingRule = () =>
    createSpotlightRule({
        message: SpotlightMessage.ITEM_SHARING,
        when: (previous) => !previous,
    });

export const createAliasDiscoveryRules = (store: Store<State>): SpotlightRule[] =>
    [
        SpotlightMessage.ALIAS_DISCOVERY_CUSTOMIZE,
        SpotlightMessage.ALIAS_DISCOVERY_MAILBOX,
        SpotlightMessage.ALIAS_DISCOVERY_DOMAIN,
        SpotlightMessage.ALIAS_DISCOVERY_CONTACT,
    ].map((message) =>
        createSpotlightRule({
            message,
            when: (previous) => {
                const aliasCount = selectAliasItems(store.getState()).length;
                return !previous && aliasCount > 2;
            },
        })
    );

export const createFileAttachmentsDiscoveryRule = (store: Store<State>): SpotlightRule =>
    createSpotlightRule({
        message: SpotlightMessage.FILE_ATTACHMENTS_DISCOVERY,
        when: (previous) => {
            const state = store.getState();
            const hasFiles = selectAllItems(state).some(or(hasAttachments, hasHadAttachments));
            if (hasFiles) return false;

            const plan = selectUserPlan(state);
            const passPlan = selectPassPlan(state);
            const fileAttachmentsEnabled = isPaidPlan(passPlan) && plan?.DisplayName !== 'Pass Essentials';
            return fileAttachmentsEnabled && !previous;
        },
    });

export const createProtonAnniversary2025Rule = () =>
    createSpotlightRule({
        message: SpotlightMessage.PROTON_ANNIVERSARY_2025_PROMO,
        when: (previous) => !previous,
    });
