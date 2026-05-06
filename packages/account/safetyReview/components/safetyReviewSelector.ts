import { createSelector } from '@reduxjs/toolkit';

import { selectRecoveryState } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { selectUser } from '@proton/account/user';
import { selectUserSettings } from '@proton/account/userSettings';
import { getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys';

export const safetyReviewSelector = createSelector(
    [selectUser, selectUserSettings, selectRecoveryState],
    ({ value: user }, { value: userSettings }, recoveryState) => {
        const isSSOUser = getIsSSOVPNOnlyAccount(user);
        const isSafetyReviewAvailable = Boolean(user?.isPrivate) && !isSSOUser;

        const loading = !user || !userSettings || recoveryState.loading;

        return {
            user,
            isSafetyReviewAvailable,
            recoveryState,
            loading,
        };
    }
);

export type SafetyReviewState = ReturnType<typeof safetyReviewSelector>;
