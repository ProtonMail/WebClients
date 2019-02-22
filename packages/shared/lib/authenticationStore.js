import { encodeUtf8Base64, decodeUtf8Base64 } from 'pmcrypto';

import createStore from './helpers/store';
import { load, save } from './helpers/secureSessionStorage';
import { MAILBOX_PASSWORD_KEY, UID_KEY } from './constants';
import { attachOnUnload } from './helpers/dom';

const WHITELIST = [
    MAILBOX_PASSWORD_KEY,
    UID_KEY
];

const createAuthStore = ({ set, get, reset }) => {
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
        getPassword,
        reset
    }
};

export default () => {
    const { set, get, reset, getState } = createStore(load(WHITELIST));
    const authStore = createAuthStore({ set, get, reset });

    attachOnUnload(() => {
        save(getState());
    });

    return authStore;
};

