import { createSelector } from '@reduxjs/toolkit';

import { getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys';

import { selectUser } from '../../user';
import { selectUserSettings } from '../../userSettings';
import { selectRecoveryState } from '../recoveryState/recoveryState';

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
