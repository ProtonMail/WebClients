import { encodeUtf8Base64, decodeUtf8Base64 } from 'pmcrypto';

import { MAILBOX_PASSWORD_KEY, UID_KEY } from './constants';

const createAuthStore = ({ set, get }) => {
    const setUID = (UID) => set(UID_KEY, UID);
    const getUID = () => get(UID_KEY);

    const setPassword = (password) => set(MAILBOX_PASSWORD_KEY, encodeUtf8Base64(password));
    const getPassword = () => {
        const value = get(MAILBOX_PASSWORD_KEY);
        return value ? decodeUtf8Base64(value) : undefined;
    };

    const hasSession = () => !!getUID();

    return {
        getUID,
        setUID,
        hasSession,
        setPassword,
        getPassword
    };
};

export default ({ set, get, reset }) => {
    return createAuthStore({ set, get, reset });
};
