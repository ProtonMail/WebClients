import { decodeUtf8Base64, encodeUtf8Base64 } from '@proton/crypto/lib/utils';
import type { OfflineKey } from '@proton/shared/lib/authentication/offlineKey';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';

import { appMode } from '../webpack.constants';
import { getBasename, getLocalIDFromPathname } from './pathnameHelper';
import { getPersistedSession } from './persistedSessionStorage';

const MAILBOX_PASSWORD_KEY = 'proton:mailbox_pwd';
const UID_KEY = 'proton:oauth:UID';
const LOCAL_ID_KEY = 'proton:localID';
const PERSIST_SESSION_KEY = 'proton:persistSession';
const TRUST_SESSION_KEY = 'proton:trustSession';
const CLIENT_KEY_KEY = 'proton:clientKey';
const OFFLINE_KEY_KEY = 'proton:offlineKey';

interface AuthData {
    UID: string | undefined;
    localID: number | undefined;
    basename: string | undefined;
}

const defaultAuthData = {
    UID: undefined,
    localID: undefined,
    basename: undefined,
};

const getInitialState = (mode: 'sso' | 'standalone', oldUID?: string, oldLocalID?: number): AuthData => {
    if (mode === 'standalone') {
        return {
            UID: oldUID,
            localID: oldLocalID,
            basename: undefined,
        };
    }
    const { pathname } = window.location;
    const localID = getLocalIDFromPathname(pathname);
    if (localID === undefined) {
        return defaultAuthData;
    }
    const persistedSession = getPersistedSession(localID);
    // Current session is active and actual
    if (persistedSession && (oldUID === undefined || (persistedSession.UID === oldUID && localID === oldLocalID))) {
        return {
            UID: persistedSession.UID,
            localID,
            basename: getBasename(localID),
        };
    }
    return defaultAuthData;
};

interface Arguments {
    mode?: 'sso' | 'standalone';
    initialAuth?: boolean;
    store: {
        set: (key: string, value: any) => void;
        get: (key: string) => any;
    };
    onUID?: (UID: string | undefined) => void;
}

const createAuthenticationStore = ({ mode = appMode, initialAuth, store: { set, get }, onUID }: Arguments) => {
    const setUID = (UID: string | undefined) => {
        set(UID_KEY, UID);
        onUID?.(UID);
    };
    const getUID = (): string => get(UID_KEY);

    const setPassword = (password: string | undefined) => {
        if (password === undefined) {
            set(MAILBOX_PASSWORD_KEY, password);
            return;
        }
        set(MAILBOX_PASSWORD_KEY, encodeUtf8Base64(password));
    };
    const getPassword = () => {
        const value: string | undefined = get(MAILBOX_PASSWORD_KEY);
        if (value === undefined) {
            return '';
        }
        return decodeUtf8Base64(value);
    };

    const getLocalID = () => get(LOCAL_ID_KEY);

    const setLocalID = (LocalID: number | undefined) => {
        set(LOCAL_ID_KEY, LocalID);
    };

    const hasSession = () => !!getUID();

    const setPersistent = (persist: boolean | undefined) => set(PERSIST_SESSION_KEY, persist);
    // Keep old default behavior
    const getPersistent = () => get(PERSIST_SESSION_KEY) ?? true;

    const setClientKey = (clientKey: string | undefined) => set(CLIENT_KEY_KEY, clientKey);
    const getClientKey = (): string | undefined => get(CLIENT_KEY_KEY) ?? undefined;

    const setOfflineKey = (offlineKey: OfflineKey | undefined) => set(OFFLINE_KEY_KEY, offlineKey);
    const getOfflineKey = (): OfflineKey | undefined => get(OFFLINE_KEY_KEY) ?? undefined;

    const setTrusted = (trusted: boolean | undefined) => set(TRUST_SESSION_KEY, trusted);
    const getTrusted = () => get(TRUST_SESSION_KEY) ?? false;

    const initialUID = getUID();
    let initialAuthData: AuthData =
        initialAuth === false ? defaultAuthData : getInitialState(mode, initialUID, getLocalID());
    let basename = initialAuthData.basename;
    // Ensure the store is up-to-date
    setUID(initialAuthData?.UID);
    setLocalID(initialAuthData?.localID);

    const login = ({
        UID: newUID,
        keyPassword,
        localID: newLocalID,
        persistedSession: { persistent, trusted },
        clientKey,
        offlineKey,
    }: ResumedSessionResult) => {
        setUID(newUID);
        setPassword(keyPassword);
        setPersistent(persistent);
        setTrusted(trusted);
        setClientKey(clientKey);
        setOfflineKey(offlineKey);

        if (newLocalID !== undefined) {
            setLocalID(newLocalID);
            if (mode === 'sso') {
                basename = getBasename(newLocalID);
            }
        } else {
            setLocalID(undefined);
            basename = undefined;
        }
    };

    const logout = () => {
        setUID(undefined);
        setPassword(undefined);
        setPersistent(undefined);
        setLocalID(undefined);
        setTrusted(undefined);
        setClientKey(undefined);
        setOfflineKey(undefined);
        basename = undefined;
    };

    return {
        getUID,
        setUID,
        setLocalID,
        getLocalID,
        hasSession,
        setPassword,
        getPassword,
        setPersistent,
        getPersistent,
        setClientKey,
        getClientKey,
        setOfflineKey,
        getOfflineKey,
        setTrusted,
        getTrusted,
        logout,
        login,
        mode,
        get UID() {
            return getUID();
        },
        get localID() {
            return getLocalID();
        },
        get basename() {
            return basename;
        },
        get ready(): boolean {
            return Boolean(initialAuthData.UID && initialUID && getClientKey());
        },
    };
};

export type AuthenticationStore = ReturnType<typeof createAuthenticationStore>;

export default createAuthenticationStore;
