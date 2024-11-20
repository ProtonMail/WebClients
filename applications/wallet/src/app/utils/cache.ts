import { CHANGESET_KEY_PREFIX } from '../constants/cache';

export const clearChangeSet = (fingerprint: String) => {
    Object.keys(window.localStorage)
        .filter((x) => x.startsWith(CHANGESET_KEY_PREFIX + fingerprint + '_'))
        .forEach((x) => localStorage.removeItem(x));
};
