import { MAIN_USER_KEY } from 'proton-shared/lib/constants';
import { describe } from 'proton-shared/lib/state/keys/keysAlgorithm';

import { STATUSES } from './KeysStatus';

const convertKey = (address) => ({ decryptedPrivateKey, Key, info }, i) => {
    const getStatus = () => {
        const statuses = [];

        if (i === 0) {
            statuses.push(STATUSES.PRIMARY);
        }

        if (decryptedPrivateKey) {
            statuses.push(STATUSES.DECRYPTED);
        }

        if (!decryptedPrivateKey) {
            statuses.push(STATUSES.ENCRYPTED);
        }

        if (decryptedPrivateKey && Key.Flags > 0 && Key.Flags < 3 && address.Status !== 0) {
            statuses.push(STATUSES.COMPROMISED);
        }

        if (Key.Flags === 0) {
            statuses.push(STATUSES.OBSOLETE);
        }

        if (address.Status === 0) {
            statuses.push(STATUSES.DISABLED);
        }

        return statuses;
    };

    return {
        id: Key.ID,
        fingerprint: info.fingerprint,
        type: describe(info),
        statuses: getStatus()
    };
};

const getKeysList = (keys = [], convertKey) => {
    if (!keys.length) {
        return [];
    }
    return keys.map(convertKey);
};

export const getAddressesKeys = (addresses = [], keys = {}) => {
    return addresses.reduce((acc, address) => {
        const addressKeys = getKeysList(keys[address.ID], convertKey(address));
        if (!addressKeys.length) {
            return acc;
        }

        const firstUserKey = addressKeys[0];
        acc.push({
            email: address.Email,
            ...firstUserKey,
            keys: addressKeys
        });

        return acc;
    }, []);
};

export const getUserAddressKeys = (user = {}, keys = {}) => {
    const userKeys = getKeysList(keys[MAIN_USER_KEY], convertKey(user));
    if (!userKeys.length) {
        return [];
    }
    const firstUserKey = userKeys[0];
    return [
        {
            email: user.Name,
            ...firstUserKey,
            keys: userKeys
        }
    ];
};
