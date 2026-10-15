import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';

/**
 * "Keep me signed in" for the identity provider tab. The tab opens with a copy of the opener's session storage, so
 * when it signs in itself instead of handing the token back, it still has the choice. Read once, then deleted.
 */
const key = 'sso-persistent';

export const saveSSOPersistent = (persistent: boolean) => {
    setItem(key, persistent ? '1' : '0');
};

export const clearSSOPersistent = () => {
    removeItem(key);
};

export const consumeSSOPersistent = (): boolean | undefined => {
    const value = getItem(key);
    clearSSOPersistent();
    if (value === undefined) {
        return undefined;
    }
    return value === '1';
};
