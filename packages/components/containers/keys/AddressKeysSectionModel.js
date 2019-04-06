import { describe } from 'proton-shared/lib/keys/keysAlgorithm';
import { compare } from 'proton-shared/lib/helpers/array';

import { STATUSES } from './KeysStatus';
import { ACTIONS } from './KeysActions';

const createConvertKey = ({ user, address, handlers }) => ({ decryptedPrivateKey, Key, info }, i) => {
    const handleAction = (fn) => () => fn({ user, address, Key, info });

    const { Flags } = Key;
    const { Status } = address || {};

    const isPrimary = i === 0;
    const isDecrypted = !!decryptedPrivateKey;
    const isCompromised = isDecrypted && Flags > 0 && Flags < 3 && Status !== 0;
    const isSubUser = user.isSubUser;
    const isContactKey = !address;

    const statuses = [
        isPrimary && STATUSES.PRIMARY,
        isDecrypted && STATUSES.DECRYPTED,
        !isDecrypted && STATUSES.ENCRYPTED,
        isCompromised && STATUSES.COMPROMISED,
        Flags === 0 && STATUSES.OBSOLETE,
        Status === 0 && STATUSES.DISABLED
    ].filter(Boolean);

    const canExport = !isSubUser && isDecrypted;
    const canReactivate = !isDecrypted;
    const canDelete = !isPrimary && !isContactKey;
    const canMakePrimary = !isPrimary && isDecrypted && Flags === 3 && Status !== 0;

    const canMark = !isContactKey;
    // TODO: There is one MARK OBSOLETE case to investigate when Flags === 0 for addresses
    const canMarkObsolete = canMark && Flags > 1 && Status !== 0;
    const canMarkCompromised = canMark && Flags !== 0;
    const canMarkValid = canMark && isCompromised;

    const actions = [
        canExport && ACTIONS.EXPORT,
        canReactivate && ACTIONS.REACTIVATE,
        canMakePrimary && ACTIONS.PRIMARY,
        canMarkCompromised && ACTIONS.MARK_COMPROMISED,
        canMarkObsolete && ACTIONS.MARK_OBSOLETE,
        canMarkValid && ACTIONS.MARK_VALID,
        canDelete && ACTIONS.DELETE
    ]
        .filter(Boolean)
        .map((action) => ({ action, cb: handleAction(handlers[action]) }));

    return {
        id: Key.ID,
        fingerprint: info.fingerprint,
        type: describe(info),
        statuses,
        actions
    };
};

const getKeysList = (keys = {}, convertKey) => {
    const keysKeys = Object.keys(keys);
    if (!keysKeys.length) {
        return [];
    }
    return keysKeys
        .map((keyKey) => keys[keyKey])
        .sort((a, b) => {
            const {
                Key: { Primary: aPrimary }
            } = a;
            const {
                Key: { Primary: bPrimary }
            } = b;

            return compare(bPrimary, aPrimary);
        })
        .map(convertKey);
};

export const getAddressesKeys = (user = {}, addresses = [], keys = {}, handlers = {}) => {
    return addresses.reduce((acc, address) => {
        const addressKeys = getKeysList(keys[address.ID], createConvertKey({ user, address, handlers }));
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

export const getUserAddressKeys = (user = {}, keys = {}, handlers = {}) => {
    const userKeys = getKeysList(keys, createConvertKey({ user, handlers }));
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
