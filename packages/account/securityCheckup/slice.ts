import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type {
    BackLink,
    SecurityCheckupAction,
    SecurityCheckupSession,
    SecurityCheckupSource,
} from '@proton/shared/lib/interfaces/securityCheckup';
import SecurityCheckupCohort from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';
import type SecurityState from '@proton/shared/lib/interfaces/securityCheckup/SecurityState';

import getBackLink from './helpers/getBackLink';
import getSecurityCheckupRecommendations from './helpers/getSecurityCheckupRecommendations';
import getValidSecurityCheckupSession from './helpers/getValidSecurityCheckupSession';

const name = 'securityCheckup' as const;

interface SecurityCheckupState {
    securityState: SecurityState;
    cohort: SecurityCheckupCohort | undefined;
    session: SecurityCheckupSession | undefined;
    actions: SecurityCheckupAction[];
    furtherActions: SecurityCheckupAction[];
    loading: boolean;
    backLink?: BackLink;
    source?: SecurityCheckupSource;
}

export interface SecurityCheckupReduxState {
    [name]: SecurityCheckupState;
}

const initialState: SecurityCheckupState = {
    securityState: {
        phrase: {
            isAvailable: false,
            isSet: false,
            isOutdated: false,
        },
        email: {
            value: '',
            isEnabled: false,
            verified: false,
        },
        phone: {
            value: '',
            isEnabled: false,
            verified: false,
        },
        deviceRecovery: {
            isAvailable: false,
            isEnabled: false,
        },
    },
    loading: true,
    cohort: undefined,
    session: undefined,
    actions: [],
    furtherActions: [],
};

export const securityCheckupSlice = createSlice({
    name,
    initialState,
    reducers: {
        setSecurityState: (
            state,
            action: PayloadAction<{
                securityState: SecurityState;
            }>
        ) => {
            const { securityState } = action.payload;

            state.securityState = securityState;

            const { cohort, actions, furtherActions } = getSecurityCheckupRecommendations(securityState);

            state.cohort = cohort;
            state.actions = actions;
            state.furtherActions = furtherActions;
        },
        setLoading: (state, action: PayloadAction<{ loading: boolean }>) => {
            const { loading } = action.payload;

            state.loading = loading;
        },
        setBackLink: (state, action: PayloadAction<{ backHref: string; hostname: string }>) => {
            const { backHref, hostname } = action.payload;

            try {
                const backLink = getBackLink({
                    backHref,
                    hostname,
                });
                state.backLink = backLink;
            } catch (error) {
                state.backLink = undefined;
            }
        },
        setSession: (state, action: PayloadAction<{ session: SecurityCheckupSession | undefined }>) => {
            const { session } = action.payload;

            state.session = getValidSecurityCheckupSession({
                currentSession: session,
                currentCohort: state.cohort || SecurityCheckupCohort.NO_RECOVERY_METHOD,
            });
        },
        clearSession: (state) => {
            state.session = undefined;
        },
        setSource: (state, action: PayloadAction<{ source: SecurityCheckupSource | undefined }>) => {
            const { source } = action.payload;

            state.source = source;
        },
        clearSource: (state) => {
            state.source = undefined;
        },
    },
});

export const { setBackLink } = securityCheckupSlice.actions;

export const selectSecurityCheckup = (state: { [name]: SecurityCheckupState }) => state[name];
