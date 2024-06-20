import type { OfflineConfig } from '@proton/pass/lib/cache/crypto';
import type { Maybe, Store } from '@proton/pass/types';
import { encodedGetter, encodedSetter } from '@proton/pass/utils/store';

import { LockMode } from './lock/types';
import type { AuthSessionVersion } from './session';
import { type AuthSession, SESSION_VERSION } from './session';

export type AuthStore = ReturnType<typeof createAuthStore>;

const PASS_ACCESS_TOKEN_KEY = 'pass:access_token';
const PASS_LOCAL_ID_KEY = 'pass:local_id';
const PASS_LOCK_LAST_EXTEND_TIME = 'pass:lock_extend_time';
const PASS_LOCK_MODE_KEY = 'pass:lock_mode';
const PASS_LOCK_STATE_KEY = 'pass:lock_state';
const PASS_LOCK_TOKEN_KEY = 'pass:lock_token';
const PASS_LOCK_TTL_KEY = 'pass:lock_ttl';
const PASS_MAILBOX_PWD_KEY = 'pass:mailbox_pwd';
const PASS_OFFLINE_CONFIG_KEY = 'pass:offline_config';
const PASS_OFFLINE_KD_KEY = 'pass:offline_kd';
const PASS_OFFLINE_VERIFIER = 'pass:offline_verifier';
const PASS_REFRESH_TIME_KEY = 'pass:refresh_time';
const PASS_REFRESH_TOKEN_KEY = 'pass:refresh_token';
const PASS_SESSION_VERSION_KEY = 'pass:session_version';
const PASS_UID_KEY = 'pass:uid';
const PASS_UNLOCK_RETRY_KEY = 'pass:unlock_retry_count';
const PASS_USER_ID_KEY = 'pass:user_id';

export const createAuthStore = (store: Store) => {
    const authStore = {
        clear: () => store.reset(),

        hasSession: (localID?: number) =>
            Boolean(authStore.getUID() && (localID === undefined || authStore.getLocalID() === localID)),

        hasOfflinePassword: () =>
            Boolean(authStore.getOfflineConfig() && authStore.getOfflineKD() && authStore.getOfflineVerifier()),

        getSession: (): AuthSession => ({
            AccessToken: authStore.getAccessToken() ?? '',
            keyPassword: authStore.getPassword() ?? '',
            LocalID: authStore.getLocalID(),
            lockMode: authStore.getLockMode(),
            lockTTL: authStore.getLockTTL(),
            offlineConfig: authStore.getOfflineConfig(),
            offlineKD: authStore.getOfflineKD(),
            offlineVerifier: authStore.getOfflineVerifier(),
            payloadVersion: authStore.getSessionVersion(),
            RefreshTime: authStore.getRefreshTime(),
            RefreshToken: authStore.getRefreshToken() ?? '',
            sessionLockToken: authStore.getLockToken(),
            UID: authStore.getUID() ?? '',
            unlockRetryCount: authStore.getUnlockRetryCount(),
            UserID: authStore.getUserID() ?? '',
        }),

        setSession: (session: Partial<AuthSession>) => {
            if (session.AccessToken) authStore.setAccessToken(session.AccessToken);
            if (session.keyPassword) authStore.setPassword(session.keyPassword);
            if (session.LocalID !== undefined) authStore.setLocalID(session.LocalID);
            if (session.lockMode) authStore.setLockMode(session.lockMode);
            if (session.lockTTL) authStore.setLockTTL(session.lockTTL);
            if (session.offlineConfig) authStore.setOfflineConfig(session.offlineConfig);
            if (session.offlineKD) authStore.setOfflineKD(session.offlineKD);
            if (session.offlineVerifier) authStore.setOfflineVerifier(session.offlineVerifier);
            if (session.payloadVersion !== undefined) authStore.setSessionVersion(session.payloadVersion);
            if (session.RefreshTime) authStore.setRefreshTime(session.RefreshTime);
            if (session.RefreshToken) authStore.setRefreshToken(session.RefreshToken);
            if (session.sessionLockToken) authStore.setLockToken(session.sessionLockToken);
            if (session.UID) authStore.setUID(session.UID);
            if (session.unlockRetryCount !== undefined) authStore.setUnlockRetryCount(session.unlockRetryCount);
            if (session.UserID) authStore.setUserID(session.UserID);
        },

        setAccessToken: (accessToken: Maybe<string>): void => store.set(PASS_ACCESS_TOKEN_KEY, accessToken),
        getAccessToken: (): Maybe<string> => store.get(PASS_ACCESS_TOKEN_KEY),
        setRefreshToken: (refreshToken: Maybe<string>): void => store.set(PASS_REFRESH_TOKEN_KEY, refreshToken),
        getRefreshToken: (): Maybe<string> => store.get(PASS_REFRESH_TOKEN_KEY),
        setRefreshTime: (refreshTime: Maybe<number>) => store.set(PASS_REFRESH_TIME_KEY, refreshTime),
        getRefreshTime: (): Maybe<number> => store.get(PASS_REFRESH_TIME_KEY),

        setUID: (UID: Maybe<string>): void => store.set(PASS_UID_KEY, UID),
        getUID: (): Maybe<string> => store.get(PASS_UID_KEY),
        setUserID: (UserID: Maybe<string>): void => store.set(PASS_USER_ID_KEY, UserID),
        getUserID: (): Maybe<string> => store.get(PASS_USER_ID_KEY),
        setPassword: encodedSetter(store)(PASS_MAILBOX_PWD_KEY),
        getPassword: encodedGetter(store)(PASS_MAILBOX_PWD_KEY),
        setLocalID: (LocalID: Maybe<number>): void => store.set(PASS_LOCAL_ID_KEY, LocalID),
        getLocalID: (): Maybe<number> => store.get(PASS_LOCAL_ID_KEY),

        setOfflineKD: encodedSetter(store)(PASS_OFFLINE_KD_KEY),
        getOfflineKD: encodedGetter(store)(PASS_OFFLINE_KD_KEY),
        setOfflineConfig: (config: Maybe<OfflineConfig>) => store.set(PASS_OFFLINE_CONFIG_KEY, config),
        getOfflineConfig: (): Maybe<OfflineConfig> => store.get(PASS_OFFLINE_CONFIG_KEY),
        setOfflineVerifier: encodedSetter(store)(PASS_OFFLINE_VERIFIER),
        getOfflineVerifier: encodedGetter(store)(PASS_OFFLINE_VERIFIER),

        setLockMode: (mode: LockMode): void => store.set(PASS_LOCK_MODE_KEY, mode),
        getLockMode: (): LockMode => store.get(PASS_LOCK_MODE_KEY) ?? LockMode.NONE,
        setLocked: (status: boolean): void => store.set(PASS_LOCK_STATE_KEY, status),
        getLocked: (): Maybe<boolean> => store.get(PASS_LOCK_STATE_KEY),
        setLockToken: encodedSetter(store)(PASS_LOCK_TOKEN_KEY),
        getLockToken: encodedGetter(store)(PASS_LOCK_TOKEN_KEY),
        setLockTTL: (ttl: Maybe<number>) => store.set(PASS_LOCK_TTL_KEY, ttl),
        getLockTTL: (): Maybe<number> => store.get(PASS_LOCK_TTL_KEY),
        setLockLastExtendTime: (extendTime: Maybe<number>): void => store.set(PASS_LOCK_LAST_EXTEND_TIME, extendTime),
        getLockLastExtendTime: (): Maybe<number> => store.get(PASS_LOCK_LAST_EXTEND_TIME),

        setUnlockRetryCount: (count: number): void => store.set(PASS_UNLOCK_RETRY_KEY, count),
        getUnlockRetryCount: (): number => store.get(PASS_UNLOCK_RETRY_KEY) ?? 0,

        getSessionVersion: (): AuthSessionVersion => store.get(PASS_SESSION_VERSION_KEY) ?? SESSION_VERSION,
        setSessionVersion: (version: AuthSessionVersion) => store.set(PASS_SESSION_VERSION_KEY, version),
    };

    return authStore;
};

export let authStore: AuthStore;
export const exposeAuthStore = (value: AuthStore) => (authStore = value);
