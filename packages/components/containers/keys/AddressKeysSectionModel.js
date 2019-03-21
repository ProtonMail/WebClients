import { MAIN_USER_KEY } from 'proton-shared/lib/constants';
import { describe } from 'proton-shared/lib/keys/keysAlgorithm';

import { STATUSES } from './KeysStatus';

const convertKey = (address) => ({ decryptedPrivateKey, Key, info }, i) => {
    const getStatus = () => {
        const statuses = [];
        const { Flags } = Key;
        const { Status } = address;

        if (i === 0) {
            statuses.push(STATUSES.PRIMARY);
        }

        if (decryptedPrivateKey) {
            statuses.push(STATUSES.DECRYPTED);
        }

        if (!decryptedPrivateKey) {
            statuses.push(STATUSES.ENCRYPTED);
        }

        if (decryptedPrivateKey && Flags > 0 && Flags < 3 && Status !== 0) {
            statuses.push(STATUSES.COMPROMISED);
        }

        if (Flags === 0) {
            statuses.push(STATUSES.OBSOLETE);
        }

        if (Status === 0) {
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

        const primaryKey = addressKeys[0];
        acc.push({
            email: address.Email,
            ...primaryKey,
            keys: addressKeys
        });

        return acc;
    }, []);
};

export const getUserAddressKeys = (user = {}, keys = {}) => {
    const userKeys = getKeysList(keys[MAIN_USER_KEY], convertKey({}));
    if (!userKeys.length) {
        return [];
    }
    const primaryKey = userKeys[0];
    return [
        {
            email: user.Name,
            ...primaryKey,
            keys: userKeys
        }
    ];
};
