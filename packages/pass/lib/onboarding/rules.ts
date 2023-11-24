import type { Store } from 'redux';

import { PASS_BF_2023_DATES } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import {
    selectFeatureFlag,
    selectHasRegisteredLock,
    selectPassPlan,
    selectUserState,
} from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import type { Maybe, MaybeNull } from '@proton/pass/types';
import { OnboardingMessage } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { merge } from '@proton/pass/utils/object/merge';
import { UNIX_DAY } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';

import { createOnboardingRule } from './service';

export const createPendingShareAccessRule = (store: Store<State>) =>
    createOnboardingRule({
        message: OnboardingMessage.PENDING_SHARE_ACCESS,
        when: (previous) => {
            if (previous) return false;
            const state = store.getState();
            const newUserSharingEnabled = selectFeatureFlag(PassFeature.PassSharingNewUsers)(state);
            const { waitingNewUserInvites } = selectUserState(state);
            return newUserSharingEnabled && (waitingNewUserInvites ?? 0) > 0;
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

export const createBlackFridayRule = (store: Store<State>) =>
    createOnboardingRule({
        message: OnboardingMessage.BLACK_FRIDAY_OFFER,
        when: (previous) => {
            const passPlan = selectPassPlan(store.getState());
            if (passPlan === UserPassPlan.PLUS) return false;

            const now = api.getState().serverTime?.getTime() ?? Date.now();
            return !previous && now > PASS_BF_2023_DATES[0] && now < PASS_BF_2023_DATES[1];
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

export const createSecurityRule = (store: Store<State>) =>
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
    });

export const createUserRatingRule = (store: Store<State>) =>
    createOnboardingRule({
        message: OnboardingMessage.USER_RATING,
        when: (previous) => {
            const PROMPT_ITEM_COUNT = 10;
            const { createdItemsCount } = store.getState().settings;
            return !previous && createdItemsCount >= PROMPT_ITEM_COUNT;
        },
    });
