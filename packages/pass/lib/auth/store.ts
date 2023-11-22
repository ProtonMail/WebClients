import type { Maybe, SessionLockStatus } from '@proton/pass/types';
import type { Store } from '@proton/pass/utils/store';
import { encodedGetter, encodedSetter } from '@proton/pass/utils/store';

import type { AuthSession } from './session';

export type AuthStore = ReturnType<typeof createAuthStore>;

const PASS_ACCESS_TOKEN_KEY = 'pass:access_token';
const PASS_LOCAL_ID_KEY = 'pass:local_id';
const PASS_LOCK_LAST_EXTEND_TIME = 'pass:lock_extend_time';
const PASS_LOCK_STATUS_KEY = 'pass:lock_status';
const PASS_LOCK_TOKEN_KEY = 'pass:lock_token';
const PASS_LOCK_TTL_KEY = 'pass:lock_ttl';
const PASS_MAILBOX_PWD_KEY = 'pass:mailbox_pwd';
const PASS_REFRESH_TIME_KEY = 'pass:refresh_time';
const PASS_REFRESH_TOKEN_KEY = 'pass:refresh_token';
const PASS_UID_KEY = 'pass:uid';
const PASS_USER_ID_KEY = 'pass:user_id';

export const createAuthStore = (store: Store) => {
    const authStore = {
        clear: () => store.reset(),

        hasSession: (localID?: number) =>
            Boolean(authStore.getUID() && (!localID || authStore.getLocalID() === localID)),

        getSession: (): AuthSession => ({
            AccessToken: authStore.getAccessToken() ?? '',
            keyPassword: authStore.getPassword(),
            LocalID: authStore.getLocalID(),
            RefreshTime: authStore.getRefreshTime(),
            RefreshToken: authStore.getRefreshToken() ?? '',
            sessionLockToken: authStore.getLockToken(),
            UID: authStore.getUID() ?? '',
            UserID: authStore.getUserID() ?? '',
        }),

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
        getPassword: encodedGetter(store)(PASS_MAILBOX_PWD_KEY, ''),
        setLocalID: (LocalID: Maybe<number>): void => store.set(PASS_LOCAL_ID_KEY, LocalID),
        getLocalID: (): Maybe<number> => store.get(PASS_LOCAL_ID_KEY),

        setLockStatus: (status: Maybe<SessionLockStatus>): void => store.set(PASS_LOCK_STATUS_KEY, status),
        getLockStatus: (): Maybe<SessionLockStatus> => store.get(PASS_LOCK_STATUS_KEY),
        setLockToken: encodedSetter(store)(PASS_LOCK_TOKEN_KEY),
        getLockToken: encodedGetter(store)(PASS_LOCK_TOKEN_KEY, undefined),
        setLockTTL: (ttl: Maybe<number>) => store.set(PASS_LOCK_TTL_KEY, ttl),
        getLockTTL: (): Maybe<number> => store.get(PASS_LOCK_TTL_KEY),
        setLockLastExtendTime: (extendTime: Maybe<number>): void => store.set(PASS_LOCK_LAST_EXTEND_TIME, extendTime),
        getLockLastExtendTime: (): Maybe<number> => store.get(PASS_LOCK_LAST_EXTEND_TIME),
    };

    return authStore;
};

export let authentication: AuthStore;
export const exposeAuthStore = (value: AuthStore) => (authentication = value);
