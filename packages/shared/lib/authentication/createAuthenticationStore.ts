import { encodeUtf8Base64, decodeUtf8Base64 } from 'pmcrypto';

import { MAILBOX_PASSWORD_KEY, UID_KEY, LOCAL_ID_KEY } from '../constants';

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
        const value = get(MAILBOX_PASSWORD_KEY);
        if (value === undefined) {
            return '';
        }
        return decodeUtf8Base64(value);
    };

    const setLocalID = (LocalID: number) => set(LOCAL_ID_KEY, LocalID);
    const getLocalID = () => get(LOCAL_ID_KEY);

    const hasSession = () => !!getUID();

    return {
        getUID,
        setUID,
        setLocalID,
        getLocalID,
        hasSession,
        setPassword,
        getPassword,
    };
};

export type AuthenticationStore = ReturnType<typeof createAuthenticationStore>;

export default createAuthenticationStore;
