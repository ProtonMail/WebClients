import { createSlice, isAnyOf } from '@reduxjs/toolkit';
import { resetAPI } from 'proton-authenticator/lib/api';
import { config } from 'proton-authenticator/lib/app/env';
import { authService } from 'proton-authenticator/lib/auth/service';
import { db } from 'proton-authenticator/lib/db/db';
import { fetchRemoteEntries, fetchRemoteKeys } from 'proton-authenticator/lib/entries/sync';
import logger from 'proton-authenticator/lib/logger';
import { commands } from 'proton-authenticator/lib/tauri/commands';
import { createAutomaticBackup } from 'proton-authenticator/store/backup';
import { c } from 'ttag';

import { type RequestForkOptions, requestFork as getRequest } from '@proton/pass/lib/auth/fork';
import type { Maybe } from '@proton/pass/types';
import { revoke } from '@proton/shared/lib/api/auth';
import { getApiError, getIs401Error, getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { type ConsumeForkParameters, consumeFork } from '@proton/shared/lib/authentication/fork';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { resumeSession as coreResumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import type { User } from '@proton/shared/lib/interfaces/User';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';
import noop from '@proton/utils/noop';

import { createAppAsyncThunk } from './utils';

export type SyncState = 'off' | 'loading' | 'on' | 'error';

export type AuthState = {
    syncState: SyncState;
    user?: User;
    session?: PersistedSession;
};

const initialState: AuthState = { syncState: 'loading' };

const setupSession = createAppAsyncThunk(
    'auth/setupSession',
    async (resumedSession: ResumedSessionResult, { extra, dispatch }) => {
        const { User, keyPassword, persistedSession, UID } = resumedSession;
        const userKeys = await getDecryptedUserKeysHelper(User, keyPassword).catch(() => []);

        /** setup auth service / api */
        authService.addUserKeys(userKeys);
        authService.setApi(getUIDApi(UID, extra.api));

        extra.api.UID = UID;

        /** this will trigger a remote sync down the line */
        await fetchRemoteKeys();
        const hasChanged = await fetchRemoteEntries(extra);
        if (hasChanged) void dispatch(createAutomaticBackup());

        return { session: persistedSession, user: User };
    }
);

export const logout = createAppAsyncThunk(
    'auth/logout',
    async ({ soft }: Maybe<{ soft?: boolean }> = {}, { getState, extra }) => {
        const activeSession = getState().auth.session;
        const api = authService.getApi();

        if (activeSession && !soft) {
            await fetchRemoteEntries().catch(noop);
            await api?.(revoke()).catch(noop);
        }

        await db.items.toCollection().modify({ syncMetadata: undefined }).catch(noop);
        await db.keys.clear().catch(noop);
        await authService.clear().catch(noop);

        resetAPI();

        extra.createNotification({ text: c('authenticator-2025:Info').t`Sync disabled` });
    }
);

export const resumeSession = createAppAsyncThunk('auth/resumeSession', async (_, { dispatch, extra: { api } }) => {
    const [session] = getPersistedSessions();
    if (!session) return;

    try {
        logger.info(`[Auth::resumeSession] Resuming session (UID=${session.UID}, UserID=${session.UserID})`);
        const resumedSession = await coreResumeSession({ api, localID: session.localID });

        /** Refetch all entries/keys */
        void dispatch(setupSession(resumedSession));

        return resumedSession;
    } catch (err) {
        const apiError = getApiError(err);

        if (getIsConnectionIssue(err) || apiError.status === 505) {
            logger.info(`[Auth::resumeSession] Connectivity issue, returning persisted session`);
            return session;
        }

        logger.info(`[Auth::resumeSession] Failed to resume session (UID=${session.UID}, UserID=${session.UserID})`);
        if (err instanceof InvalidPersistentSessionError || getIs401Error(err)) {
            void dispatch(logout());
        }
    }
});

export const requestFork = createAppAsyncThunk('auth/requestFork', async (forkType: ForkType) => {
    const params: RequestForkOptions = {
        app: config.APP_NAME,
        forkType: forkType,
        host: config.SSO_URL,
        plan: forkType === ForkType.SIGNUP ? 'free' : undefined,
    };

    const { url } = getRequest(params);
    const windowTitle =
        forkType === ForkType.SIGNUP
            ? c('authenticator-2025:Title').t`Sign up`
            : c('authenticator-2025:Title').t`Log in`;

    await commands.logIn(windowTitle, url);
});

/** Activate proton-sync */
export const executeLogin = createAppAsyncThunk(
    'auth/executeLogin',
    async (parameters: ConsumeForkParameters, { dispatch, getState, extra: { api, createNotification } }) => {
        if (getState().auth.session) throw new Error('Already logged in');
        const { session } = await consumeFork({ api, mode: 'sso', parameters });
        await dispatch(setupSession(session));
        createNotification({ text: c('authenticator-2025:Info').t`Sync enabled` });
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        abortLogin: (state) => {
            if (!state.session) state.syncState = 'off';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(resumeSession.fulfilled, (state, { payload }) => {
                const isLoggedOut = !payload;
                if (isLoggedOut) state.syncState = 'off';

                const isOffline = payload && !Object.hasOwn(payload, 'keyPassword');
                if (isOffline) state.syncState = 'error';
            })
            .addCase(setupSession.fulfilled, (state, { payload }) => {
                state.user = payload.user;
                state.session = payload.session;
                state.syncState = 'on';
            })
            .addCase(setupSession.rejected, (state) => {
                state.syncState = 'error';
            })
            .addCase(requestFork.fulfilled, (state) => {
                state.syncState = 'loading';
            })
            .addCase(logout.pending, (state) => {
                state.syncState = 'loading';
            })
            .addMatcher(isAnyOf(executeLogin.rejected, logout.settled), (state) => {
                state.user = undefined;
                state.session = undefined;
                state.syncState = 'off';
            });
    },
});

export const { abortLogin } = authSlice.actions;

export default authSlice.reducer;
