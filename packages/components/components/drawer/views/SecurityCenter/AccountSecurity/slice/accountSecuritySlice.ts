import type { PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import type { UserSettingsState, UserState } from '@proton/account';
import type { FeaturesReducerState } from '@proton/features';
import { SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/constants';

const name = 'accountSecurity' as const;

export interface AccountSecuritySlice extends UserState, UserSettingsState, FeaturesReducerState {
    [name]: {
        loading: boolean;
        accountRecoverySet: boolean;
        dataRecoverySet: boolean;
        twoFactorAuthSet: boolean;
        recoveryPhraseSet: boolean;
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
            state.recoveryPhraseSet = action.payload.recoveryPhraseSet;
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
    state.features.AccountSecurityDismissed2FACard?.value.Value === true;
const selectHasSentinelEnabled = (state: AccountSecuritySlice) =>
    state.userSettings.value?.HighSecurity.Value === SETTINGS_PROTON_SENTINEL_STATE.ENABLED;

export const selectCanDisplayAccountSecuritySection = createSelector(
    selectIsPrivateUser,
    (isPrivateUser) => !!isPrivateUser
);

/**
 * Return exhaustive key/value list of account security issues elements
 */
export const selectAccountSecurityElements = createSelector(
    [selectAccountSecurity, selectTwoFactorAuthDismissed, selectHasSentinelEnabled, selectIsPrivateUser],
    (accountSecurity, twoFactorAuthDismissed, hasSentinelEnabled) => {
        const { accountRecoverySet, dataRecoverySet, twoFactorAuthSet, recoveryPhraseSet } = accountSecurity;

        return {
            accountRecoverySet,
            dataRecoverySet,
            twoFactorAuthSetOrDismissed: twoFactorAuthSet || twoFactorAuthDismissed,
            twoFactorAuthSet,
            recoveryPhraseSet,
            hasSentinelEnabled,
        };
    }
);

/**
 * Return of issues in the account security section
 * Display only the issues that should be considered as an account security warning
 * Use case: Visual notification on the drawer button for example.
 */
export const selectHasAccountSecurityIssue = createSelector(
    [selectAccountSecurityElements, selectAccountSecurityLoading, selectCanDisplayAccountSecuritySection],
    (elements, loading, canDisplayAccountSecurity) => {
        if (loading || !canDisplayAccountSecurity) {
            return false;
        }

        const elementsConsideredAsIssue = [elements.accountRecoverySet, elements.dataRecoverySet];

        return elementsConsideredAsIssue.some((value) => !value);
    }
);

/**
 * Returns the count of issues in the account security section
 * Use case: Allows to know if we should display cards or success message
 */
export const selectHasAccountSecurityCardToDisplay = createSelector(
    [selectAccountSecurityElements, selectAccountSecurityLoading, selectCanDisplayAccountSecuritySection],
    (elements, loading, canDisplayAccountSecurity) => {
        if (loading || !canDisplayAccountSecurity) {
            return false;
        }

        const securityCardsToDisplay = [
            elements.accountRecoverySet,
            elements.dataRecoverySet,
            elements.twoFactorAuthSetOrDismissed,
        ];

        return securityCardsToDisplay.some((value) => !value);
    }
);

/**
 * Returns the count of nondismissible issues in the account security section
 * Use case: notification count on security center button
 */
export const selectAccountSecurityIssuesCount = createSelector(
    [selectAccountSecurityElements, selectAccountSecurityLoading, selectCanDisplayAccountSecuritySection],
    (elements, loading, canDisplayAccountSecurity) => {
        if (loading || !canDisplayAccountSecurity) {
            return 0;
        }

        return [elements.accountRecoverySet, elements.dataRecoverySet].filter((value) => !value).length;
    }
);

/**
 * Returns the count of issues for SENTINEL USERS in the account security section
 * Use case: Allows to know if we should display cards or success message
 */
export const selectHasSentinelOrTFACardToDisplay = createSelector(
    [
        selectAccountSecurityElements,
        selectAccountSecurityLoading,
        selectCanDisplayAccountSecuritySection,
        selectHasSentinelEnabled,
    ],
    (elements, loading, canDisplayAccountSecurity) => {
        if (loading || !canDisplayAccountSecurity) {
            return false;
        }

        return [elements.recoveryPhraseSet, elements.twoFactorAuthSetOrDismissed].some((value) => !value);
    }
);
