import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { getFetchedAt, getFetchedEphemeral } from '@proton/redux-utilities';
import { type ActiveSessionLite, compareSessions } from '@proton/shared/lib/authentication/persistedSessionHelper';

export interface AccountSessions {
    // Self is always first
    value: ActiveSessionLite[];
    meta: {
        loading: boolean;
        support: boolean;
        fetchedAt: number;
        fetchedEphemeral: boolean | undefined;
    };
}

const name = 'sessions' as const;

export interface AccountSessionsState {
    [name]: AccountSessions;
}

const defaultState: AccountSessions = {
    value: [],
    meta: {
        loading: false,
        support: false,
        fetchedAt: 0,
        fetchedEphemeral: undefined,
    },
};

export const accountSessionsSlice = createSlice({
    name,
    initialState: defaultState,
    reducers: {
        loading(state, action: PayloadAction<boolean>) {
            state.meta.loading = action.payload;
        },
        success(
            state,
            action: PayloadAction<{
                sessions: ActiveSessionLite[];
                localID: number;
                support: AccountSessions['meta']['support'];
            }>
        ) {
            const selfSession = action.payload.sessions.find(
                (session) => session.persisted.localID === action.payload.localID
            );
            if (!selfSession) {
                return defaultState;
            }
            const otherSessions = action.payload.sessions
                .filter((other) => other !== selfSession)
                .sort(compareSessions);
            // Self session guaranteed first
            state.value = [selfSession, ...otherSessions];
            state.meta.support = action.payload.support;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        disabled() {
            return defaultState;
        },
    },
});

export const selectAccountSessions = (state: AccountSessionsState) => state[name];
