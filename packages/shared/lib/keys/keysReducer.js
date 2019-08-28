import { ACTIONS } from './keysReducerActions';

export const findKeyByFingerprint = (keys, keyFingerprint) => {
    return keys.find(({ privateKey }) => privateKey.getFingerprint() === keyFingerprint);
};

const findKeyById = (keys, keyID) => {
    return keys.find(({ Key: { ID } }) => ID === keyID);
};

/**
 * @param {Array<{Key, privateKey}>} keys - Old keys list
 * @param {Object} action
 * @param {String} action.type
 * @param {Object} action.payload
 * @return {Object} - New keys map
 */
export const keysReducer = (keys, { type, payload }) => {
    if (type === ACTIONS.ADD) {
        const keysLength = keys.length;

        const { ID: newKeyID, privateKey, flags } = payload;

        if (findKeyByFingerprint(keys, privateKey.getFingerprint()) || findKeyById(keys, newKeyID)) {
            throw new Error('Key already exists');
        }

        // Can not be a boolean, needs to be 1 or 0
        const isNewPrimary = !keysLength ? 1 : 0;

        const newKey = {
            privateKey,
            Key: {
                ID: newKeyID,
                Primary: isNewPrimary,
                Flags: flags
            }
        };

        if (isNewPrimary) {
            return [newKey];
        }

        return [...keys, newKey];
    }

    const getAndAssertOldKey = (ID) => {
        const oldKey = findKeyById(keys, ID);
        if (!oldKey) {
            throw new Error('Key does not exists');
        }
        return oldKey;
    };

    if (type === ACTIONS.REACTIVATE) {
        const { ID: targetID, privateKey, flags } = payload;

        const oldKey = getAndAssertOldKey(targetID);

        return keys.map((keyContainer) => {
            if (keyContainer === oldKey) {
                return {
                    privateKey,
                    Key: {
                        ...oldKey.Key,
                        Flags: flags
                    }
                };
            }
            return keyContainer;
        });
    }

    if (type === ACTIONS.SET_PRIMARY) {
        const { ID: targetID } = payload;

        getAndAssertOldKey(targetID);

        return keys.map((key) => {
            const { Key } = key;
            return {
                ...key,
                Key: {
                    ...Key,
                    Primary: Key.ID === targetID ? 1 : 0
                }
            };
        });
    }

    if (type === ACTIONS.REMOVE) {
        const { ID: targetID } = payload;
        const oldKey = getAndAssertOldKey(targetID);
        return keys.filter((key) => key !== oldKey);
    }

    if (type === ACTIONS.SET_FLAGS) {
        const { ID: targetID, newFlags } = payload;

        const oldKey = getAndAssertOldKey(targetID);
        return keys.map((key) => {
            if (key === oldKey) {
                return {
                    ...key,
                    Key: {
                        ...key.Key,
                        Flags: newFlags
                    }
                };
            }
            return key;
        });
    }

    throw new Error('Unsupported action');
};
