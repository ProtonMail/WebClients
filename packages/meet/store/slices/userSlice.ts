import { createSelector, createSlice } from '@reduxjs/toolkit';

import { selectOrganization } from '@proton/account/organization';
import { selectSubscription } from '@proton/account/subscription';
import { selectUser } from '@proton/account/user';
import { hasBundleBiz2025, hasBundlePro2024, hasVisionary } from '@proton/payments/core/subscription/helpers';
import { isProtoneer } from '@proton/shared/lib/helpers/organization';
import { getUserCreationDate, getUserDaysSinceCreation, isMember } from '@proton/shared/lib/user/helpers';

import type { MeetState } from '../rootReducer';

export interface MeetUserState {
    isGuest: boolean;
}

export const initialState: MeetUserState = {
    isGuest: true,
};

export const getIsGuestFromUrl = () => window.location.pathname.includes('guest');

const slice = createSlice({
    name: 'meetUser',
    initialState: () => ({
        ...initialState,
        isGuest: getIsGuestFromUrl(),
    }),
    reducers: {},
});

export const selectIsGuest = (state: MeetState) => state.meetUser.isGuest;

type SubscriptionStatus = {
    isPaidUser: boolean;
    isSubUser: boolean;
    hasSubscriptionWithoutMeet: boolean;
};

export const selectSubscriptionStatus = createSelector(
    [selectUser, selectSubscription, selectOrganization],
    (userState, subscriptionState, organizationState): SubscriptionStatus => {
        const user = userState?.value;
        const subscription = subscriptionState?.value;
        const organization = organizationState?.value;

        if (!user) {
            return { isPaidUser: false, isSubUser: false, hasSubscriptionWithoutMeet: false };
        }

        const daysSinceCreation = getUserDaysSinceCreation(getUserCreationDate(user));
        const hasSubscriptionWithMeetFeature =
            hasVisionary(subscription) ||
            hasBundlePro2024(subscription) ||
            hasBundleBiz2025(subscription) ||
            isProtoneer(organization);

        return {
            isPaidUser: daysSinceCreation < 3 || hasSubscriptionWithMeetFeature || user.hasPaidMeet,
            isSubUser: isMember(user),
            hasSubscriptionWithoutMeet: !!subscription && !hasSubscriptionWithMeetFeature && !user.hasPaidMeet,
        };
    }
);

export const selectUserId = createSelector([selectUser], (userState): string => {
    const user = userState?.value;
    return user?.ID ?? '';
});

export const meetUserReducer = { meetUser: slice.reducer };
