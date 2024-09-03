import type { OfflineConfig } from '@proton/pass/lib/cache/crypto';
import { AuthMode, type Maybe, type Store } from '@proton/pass/types';
import { isObject } from '@proton/pass/utils/object/is-object';
import { encodedGetter, encodedSetter } from '@proton/pass/utils/store';

import { AUTH_MODE } from './flags';
import { LockMode } from './lock/types';
import type { AuthSessionVersion, EncryptedAuthSession } from './session';
import { type AuthSession, SESSION_VERSION } from './session';

export type AuthStore = ReturnType<typeof createAuthStore>;
export type AuthStoreOptions = { cookies: boolean };

const PASS_ACCESS_TOKEN_KEY = 'pass:access_token';
const PASS_COOKIE_AUTH_KEY = 'pass:auth_cookies';
const PASS_CLIENT_KEY = 'pass:client_key';
const PASS_EXTRA_PWD_KEY = 'pass:extra_password';
const PASS_LOCAL_ID_KEY = 'pass:local_id';
const PASS_LOCK_EXTEND_TIME_KEY = 'pass:lock_extend_time';
const PASS_LOCK_MODE_KEY = 'pass:lock_mode';
const PASS_LOCK_STATE_KEY = 'pass:lock_state';
const PASS_LOCK_TOKEN_KEY = 'pass:lock_token';
const PASS_LOCK_TTL_KEY = 'pass:lock_ttl';
const PASS_MAILBOX_PWD_KEY = 'pass:mailbox_pwd';
const PASS_OFFLINE_CONFIG_KEY = 'pass:offline_config';
const PASS_OFFLINE_KD_KEY = 'pass:offline_kd';
const PASS_OFFLINE_VERIFIER_KEY = 'pass:offline_verifier';
const PASS_PERSISTENT_SESSION_KEY = 'pass:persistent';
const PASS_REFRESH_TIME_KEY = 'pass:refresh_time';
const PASS_REFRESH_TOKEN_KEY = 'pass:refresh_token';
const PASS_SESSION_VERSION_KEY = 'pass:session_version';
const PASS_UID_KEY = 'pass:uid';
const PASS_UNLOCK_RETRY_KEY = 'pass:unlock_retry_count';
const PASS_USER_ID_KEY = 'pass:user_id';
const PASS_ENCRYPTED_OFFLINE_KD = 'pass:encrypted_offline_kd';
const PASS_LAST_USED_DATE = 'pass:last_used_date';
const PASS_USER_EMAIL = 'pass:user_email';

export const createAuthStore = (store: Store) => {
    const authStore = {
        clear: () => store.reset(),

        hasSession: (localID?: number) =>
            Boolean(authStore.getUID() && (localID === undefined || authStore.getLocalID() === localID)),

        hasOfflinePassword: () =>
            Boolean(authStore.getOfflineConfig() && authStore.getOfflineKD() && authStore.getOfflineVerifier()),

        getSession: (): AuthSession => ({
            AccessToken: authStore.getAccessToken() ?? '',
            cookies: authStore.getCookieAuth() ?? false,
            extraPassword: authStore.getExtraPassword(),
            keyPassword: authStore.getPassword() ?? '',
            LocalID: authStore.getLocalID(),
            lockMode: authStore.getLockMode(),
            lockTTL: authStore.getLockTTL(),
            offlineConfig: authStore.getOfflineConfig(),
            offlineKD: authStore.getOfflineKD(),
            offlineVerifier: authStore.getOfflineVerifier(),
            payloadVersion: authStore.getSessionVersion(),
            persistent: authStore.getPersistent(),
            RefreshTime: authStore.getRefreshTime(),
            RefreshToken: authStore.getRefreshToken() ?? '',
            sessionLockToken: authStore.getLockToken(),
            UID: authStore.getUID() ?? '',
            unlockRetryCount: authStore.getUnlockRetryCount(),
            UserID: authStore.getUserID() ?? '',
            encryptedOfflineKD: authStore.getEncryptedOfflineKD(),
            email: authStore.getUserEmail(),
            lastUsedDate: authStore.getLastUsedDate(),
        }),

        shouldCookieUpgrade: (data: Partial<AuthSession>) => AUTH_MODE === AuthMode.COOKIE && !data.cookies,

        validSession: (data: Partial<AuthSession>): data is AuthSession =>
            Boolean(
                data.UID &&
                    data.UserID &&
                    data.keyPassword &&
                    (!data.offlineConfig || data.offlineKD) &&
                    (data.cookies || (data.AccessToken && data.RefreshToken))
            ),

        /** Checks wether a parsed persisted session object is
         * a valid `EncryptedAuthSession` in order to resume */
        validPersistedSession: (data: any): data is EncryptedAuthSession =>
            isObject(data) &&
            Boolean('UID' in data && data.UID) &&
            Boolean('UserID' in data && data.UserID) &&
            Boolean('blob' in data && data.blob) &&
            (Boolean('cookies' in data && data.cookies) ||
                (Boolean('AccessToken' in data && data.AccessToken) &&
                    Boolean('RefreshToken' in data && data.RefreshToken))),

        setSession: (session: Partial<AuthSession>) => {
            if (session.AccessToken) authStore.setAccessToken(session.AccessToken);
            if (session.extraPassword) authStore.setExtraPassword(true);
            if (session.keyPassword) authStore.setPassword(session.keyPassword);
            if (session.LocalID !== undefined) authStore.setLocalID(session.LocalID);
            if (session.lockMode) authStore.setLockMode(session.lockMode);
            if (session.lockTTL) authStore.setLockTTL(session.lockTTL);
            if (session.offlineConfig) authStore.setOfflineConfig(session.offlineConfig);
            if (session.offlineKD) authStore.setOfflineKD(session.offlineKD);
            if (session.offlineVerifier) authStore.setOfflineVerifier(session.offlineVerifier);
            if (session.payloadVersion !== undefined) authStore.setSessionVersion(session.payloadVersion);
            if (session.persistent) authStore.setPersistent(session.persistent);
            if (session.RefreshTime) authStore.setRefreshTime(session.RefreshTime);
            if (session.RefreshToken) authStore.setRefreshToken(session.RefreshToken);
            if (session.sessionLockToken) authStore.setLockToken(session.sessionLockToken);
            if (session.UID) authStore.setUID(session.UID);
            if (session.unlockRetryCount !== undefined) authStore.setUnlockRetryCount(session.unlockRetryCount);
            if (session.UserID) authStore.setUserID(session.UserID);
            if (session.cookies) authStore.setCookieAuth(session.cookies);
            if (session.encryptedOfflineKD) authStore.setEncryptedOfflineKD(session.encryptedOfflineKD);
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
        setOfflineVerifier: encodedSetter(store)(PASS_OFFLINE_VERIFIER_KEY),
        getOfflineVerifier: encodedGetter(store)(PASS_OFFLINE_VERIFIER_KEY),
        setEncryptedOfflineKD: (enryptedKD: Maybe<string>) => store.set(PASS_ENCRYPTED_OFFLINE_KD, enryptedKD),
        getEncryptedOfflineKD: (): Maybe<string> => store.get(PASS_ENCRYPTED_OFFLINE_KD),

        setLockMode: (mode: LockMode): void => store.set(PASS_LOCK_MODE_KEY, mode),
        getLockMode: (): LockMode => store.get(PASS_LOCK_MODE_KEY) ?? LockMode.NONE,
        setLocked: (status: boolean): void => store.set(PASS_LOCK_STATE_KEY, status),
        getLocked: (): Maybe<boolean> => store.get(PASS_LOCK_STATE_KEY),
        setLockToken: encodedSetter(store)(PASS_LOCK_TOKEN_KEY),
        getLockToken: encodedGetter(store)(PASS_LOCK_TOKEN_KEY),
        setLockTTL: (ttl: Maybe<number>) => store.set(PASS_LOCK_TTL_KEY, ttl),
        getLockTTL: (): Maybe<number> => store.get(PASS_LOCK_TTL_KEY),
        setLockLastExtendTime: (extendTime: Maybe<number>): void => store.set(PASS_LOCK_EXTEND_TIME_KEY, extendTime),
        getLockLastExtendTime: (): Maybe<number> => store.get(PASS_LOCK_EXTEND_TIME_KEY),

        /** Last successful login / resuming */
        setLastUsedDate: (lastUsedAt: number): void => store.set(PASS_LAST_USED_DATE, lastUsedAt),
        getLastUsedDate: (): number => store.get(PASS_LAST_USED_DATE) ?? 0,

        setUserEmail: (email: string): void => store.set(PASS_USER_EMAIL, email),
        getUserEmail: (): Maybe<string> => store.get(PASS_USER_EMAIL),

        setUnlockRetryCount: (count: number): void => store.set(PASS_UNLOCK_RETRY_KEY, count),
        getUnlockRetryCount: (): number => store.get(PASS_UNLOCK_RETRY_KEY) ?? 0,

        setExtraPassword: (enabled: boolean): void => store.set(PASS_EXTRA_PWD_KEY, enabled),
        getExtraPassword: () => store.get(PASS_EXTRA_PWD_KEY) ?? false,

        getSessionVersion: (): AuthSessionVersion => store.get(PASS_SESSION_VERSION_KEY) ?? SESSION_VERSION,
        setSessionVersion: (version: AuthSessionVersion) => store.set(PASS_SESSION_VERSION_KEY, version),

        getClientKey: encodedGetter(store)(PASS_CLIENT_KEY),
        setClientKey: encodedSetter(store)(PASS_CLIENT_KEY),

        getPersistent: (): Maybe<boolean> => store.get(PASS_PERSISTENT_SESSION_KEY),
        setPersistent: (persistent: boolean): void => store.set(PASS_PERSISTENT_SESSION_KEY, persistent),

        setCookieAuth: (enabled: boolean): void => store.set(PASS_COOKIE_AUTH_KEY, enabled),
        getCookieAuth: (): boolean => store.get(PASS_COOKIE_AUTH_KEY) ?? false,
    };

    return authStore;
};

export let authStore: AuthStore;
export const exposeAuthStore = (value: AuthStore) => (authStore = value);
