import type { Maybe, SessionLockStatus } from '../types';
import type { Store } from '../utils/store';
import { encodedGetter, encodedSetter } from '../utils/store';

export type AuthStore = ReturnType<typeof createAuthStore>;

const PASS_MAILBOX_PWD_KEY = 'pass:mailbox_pwd';
const PASS_UID_KEY = 'pass:uid';
const PASS_LOCK_STATUS_KEY = 'pass:lock_status';
const PASS_LOCK_TOKEN_KEY = 'pass:lock_token';
const PASS_LOCK_LAST_EXTEND_TIME = 'pass:lock_extend_time';

export const createAuthStore = (store: Store) => {
    const authStore = {
        setUID: (UID: Maybe<string>): void => store.set(PASS_UID_KEY, UID),
        getUID: (): Maybe<string> => store.get(PASS_UID_KEY),
        setPassword: encodedSetter(store)(PASS_MAILBOX_PWD_KEY),
        getPassword: encodedGetter(store)(PASS_MAILBOX_PWD_KEY, ''),
        setLockStatus: (status: Maybe<SessionLockStatus>): void => store.set(PASS_LOCK_STATUS_KEY, status),
        getLockStatus: (): Maybe<SessionLockStatus> => store.get(PASS_LOCK_STATUS_KEY),
        setLockToken: encodedSetter(store)(PASS_LOCK_TOKEN_KEY),
        getLockToken: encodedGetter(store)(PASS_LOCK_TOKEN_KEY, undefined),
        setLockLastExtendTime: (extendTime: Maybe<number>): void => store.set(PASS_LOCK_LAST_EXTEND_TIME, extendTime),
        getLockLastExtendTime: (): Maybe<number> => store.get(PASS_LOCK_LAST_EXTEND_TIME),
        hasSession: () => Boolean(authStore.getUID()),
    };

    return authStore;
};

export let authentication: AuthStore;
export const exposeAuthStore = (value: AuthStore) => (authentication = value);
