import { decodeUtf8Base64, encodeUtf8Base64 } from '@proton/crypto/lib/utils';

import { LOCAL_ID_KEY, MAILBOX_PASSWORD_KEY, PERSIST_SESSION_KEY, TRUST_SESSION_KEY, UID_KEY } from '../constants';

interface Arguments {
    set: (key: string, value: any) => void;
    get: (key: string) => any;
}

const createAuthenticationStore = ({ set, get }: Arguments) => {
    const setUID = (UID: string | undefined) => set(UID_KEY, UID);
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

    const setLocalID = (LocalID: number | undefined) => set(LOCAL_ID_KEY, LocalID);
    const getLocalID = () => get(LOCAL_ID_KEY);

    const hasSession = () => !!getUID();

    const setPersistent = (persist: boolean | undefined) => set(PERSIST_SESSION_KEY, persist);
    // Keep old default behavior
    const getPersistent = () => get(PERSIST_SESSION_KEY) ?? true;

    const setTrusted = (trusted: boolean | undefined) => set(TRUST_SESSION_KEY, trusted);
    const getTrusted = () => get(TRUST_SESSION_KEY) ?? false;

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
        setTrusted,
        getTrusted,
    };
};

export type AuthenticationStore = ReturnType<typeof createAuthenticationStore>;

export default createAuthenticationStore;
