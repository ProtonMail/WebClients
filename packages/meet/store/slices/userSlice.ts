import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import { selectOrganization } from '@proton/account/organization';
import { selectSubscription } from '@proton/account/subscription';
import { selectUser } from '@proton/account/user';
import { hasBundleBiz2025, hasBundlePro2024, hasVisionary } from '@proton/payments/core/subscription/helpers';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { isProtoneer } from '@proton/shared/lib/helpers/organization';
import { isMember, isUserAccountOlderThanOrEqualToDays } from '@proton/shared/lib/user/helpers';

import { getPersistedGuestBackgroundId } from '../../utils/guestBackgroundIdentity';
import type { MeetState } from '../rootReducer';

export interface MeetUserState {
    isGuest: boolean;
    guestBackgroundId: string | null;
}

export const initialState: MeetUserState = {
    isGuest: true,
    guestBackgroundId: null,
};

export const getIsGuestFromUrl = () => window.location.pathname.includes('guest');

const slice = createSlice({
    name: 'meetUser',
    initialState: (): MeetUserState => ({
        ...initialState,
        isGuest: getIsGuestFromUrl(),
        guestBackgroundId: getPersistedGuestBackgroundId() ?? null,
    }),
    reducers: {
        setGuestBackgroundId: (state, action: PayloadAction<string>) => {
            state.guestBackgroundId = action.payload;
        },
    },
});

export const { setGuestBackgroundId } = slice.actions;

export const selectIsGuest = (state: MeetState) => state.meetUser.isGuest;
export const selectGuestBackgroundId = (state: MeetState) => state.meetUser.guestBackgroundId;

type SubscriptionStatus = {
    /**
     * Whether the user is a meet paid user.
     */
    isPaidUser: boolean;
    /**
     * Whether the user is a sub user of an organization,
     * meaning they cannot upgrade to a paid plan for themselves
     * and need to ask the organization owner to upgrade.
     */
    isSubUser: boolean;
    /**
     * Whether the user has a subscription without the Meet feature.
     */
    hasSubscriptionWithoutMeet: boolean;
    /**
     * Whether we can upsell premium plan to the user.
     */
    canUpsell: boolean;
    /**
     * Whether the subscription has yet to land, so the flags above cannot be trusted.
     * Guests never load one, so nothing is pending for them.
     */
    isLoading: boolean;
};

export const selectSubscriptionStatus = createSelector(
    [selectUser, selectSubscription, selectOrganization],
    (userState, subscriptionState, organizationState): SubscriptionStatus => {
        const user = userState?.value;
        const subscription = subscriptionState?.value;
        const organization = organizationState?.value;

        if (!user) {
            return {
                isPaidUser: false,
                isSubUser: false,
                hasSubscriptionWithoutMeet: false,
                canUpsell: true,
                isLoading: false,
            };
        }

        const isAccountOldEnough = isUserAccountOlderThanOrEqualToDays(user, 3);
        const hasSubscriptionWithMeetFeature =
            hasVisionary(subscription) ||
            hasBundlePro2024(subscription) ||
            hasBundleBiz2025(subscription) ||
            isProtoneer(organization);
        const isSubUser = isMember(user);
        const hasPaidMeet = hasSubscriptionWithMeetFeature || user.hasPaidMeet;

        return {
            isPaidUser: hasPaidMeet,
            isSubUser: isSubUser,
            hasSubscriptionWithoutMeet: isPaidSubscription(subscription) && !hasPaidMeet,
            canUpsell: isAccountOldEnough && !hasPaidMeet && !isSubUser,
            isLoading: subscription === undefined,
        };
    }
);

export const selectUserId = createSelector([selectUser], (userState): string => {
    const user = userState?.value;
    return user?.ID ?? '';
});

export const meetUserReducer = { meetUser: slice.reducer };
