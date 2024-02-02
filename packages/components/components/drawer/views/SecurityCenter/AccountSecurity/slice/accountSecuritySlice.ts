import { PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';

import { UserSettingsState, UserState } from '@proton/account';
import { FeaturesState } from '@proton/features';

const name = 'accountSecurity' as const;

export interface AccountSecuritySlice extends UserState, UserSettingsState, FeaturesState {
    [name]: {
        loading: boolean;
        accountRecoverySet: boolean;
        dataRecoverySet: boolean;
        twoFactorAuthSet: boolean;
    };
}

type SliceState = AccountSecuritySlice[typeof name];

const initialState: SliceState = {
    loading: true,
} as SliceState;

const slice = createSlice({
    name,
    initialState,
    reducers: {
        setAccountSecurity(state, action: PayloadAction<SliceState>) {
            state.loading = action.payload.loading;
            state.accountRecoverySet = action.payload.accountRecoverySet;
            state.dataRecoverySet = action.payload.dataRecoverySet;
            state.twoFactorAuthSet = action.payload.twoFactorAuthSet;
        },
    },
});

export const securityCenterSliceActions = slice.actions;

export const securityCenterReducer = { [name]: slice.reducer };

/*
 * Selectors
 */
const selectIsPrivateUser = (state: AccountSecuritySlice) => state.user.value?.isPrivate;
const selectAccountSecurity = (state: AccountSecuritySlice) => state.accountSecurity;
const selectAccountSecurityLoading = (state: AccountSecuritySlice) => state.accountSecurity.loading;
const selectTwoFactorAuthDismissed = (state: AccountSecuritySlice) =>
    state.features.AccountSecurityDismissed2FACard?.Value === true;

export const selectCanDisplayAccountSecuritySection = createSelector(
    selectIsPrivateUser,
    (isPrivateUser) => !!isPrivateUser
);

export const selectAccountSecurityElements = createSelector(
    [selectAccountSecurity, selectTwoFactorAuthDismissed, selectIsPrivateUser],
    (accountSecurity, twoFactorAuthDismissed) => {
        const { accountRecoverySet, dataRecoverySet, twoFactorAuthSet } = accountSecurity;

        return {
            accountRecoverySet,
            dataRecoverySet,
            twoFactorAuthSetOrDismissed: twoFactorAuthSet || twoFactorAuthDismissed,
            twoFactorAuthSet,
        };
    }
);

export const selectAccountSecurityIssuesCount = createSelector(
    [selectAccountSecurityElements, selectAccountSecurityLoading, selectCanDisplayAccountSecuritySection],
    (elements, loading, canDisplayAccountSecurity) => {
        if (loading || !canDisplayAccountSecurity) {
            return 0;
        }

        const elementsValidForCounter = [
            elements.accountRecoverySet,
            elements.dataRecoverySet,
            elements.twoFactorAuthSetOrDismissed,
        ];

        return elementsValidForCounter.filter((value) => !value).length;
    }
);
