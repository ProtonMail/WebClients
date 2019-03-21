import { encodeUtf8Base64, decodeUtf8Base64 } from 'pmcrypto';

import createStore from './helpers/store';
import { load, save } from './helpers/secureSessionStorage';
import { MAILBOX_PASSWORD_KEY, UID_KEY } from './constants';
import { attachOnUnload } from './helpers/dom';

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
    };
};

const SECURE_SESSION_STORAGE_KEYS = [MAILBOX_PASSWORD_KEY, UID_KEY];

export default () => {
    const { set, get, reset, getState } = createStore(load(SECURE_SESSION_STORAGE_KEYS));
    const authStore = createAuthStore({ set, get, reset });

    attachOnUnload(() => {
        save(SECURE_SESSION_STORAGE_KEYS, getState());
    });

    return authStore;
};
