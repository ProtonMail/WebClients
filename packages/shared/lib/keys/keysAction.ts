import { KeyAction } from '../interfaces';

export const findKeyByFingerprint = (keys: KeyAction[], targetFingerprint: string) => {
    return keys.find(({ fingerprint }) => fingerprint === targetFingerprint);
};

export const findKeyById = (keys: KeyAction[], targetID: string) => {
    return keys.find(({ ID }) => ID === targetID);
};

export interface AddKeyArguments {
    ID: string;
    fingerprint: string;
    flags: number;
    keys: KeyAction[];
}
export const addKeyAction = ({ keys, ID: newKeyID, fingerprint, flags }: AddKeyArguments): KeyAction[] => {
    const keysLength = keys.length;

    if (findKeyByFingerprint(keys, fingerprint) || findKeyById(keys, newKeyID)) {
        throw new Error('Key already exists');
    }

    // Can not be a boolean, needs to be 1 or 0
    const isNewPrimary = !keysLength ? 1 : 0;

    const newKey = {
        ID: newKeyID,
        primary: isNewPrimary,
        flags,
        fingerprint,
    };

    if (isNewPrimary) {
        return [newKey];
    }

    return [...keys, newKey];
};

const getAndAssertOldKey = (keys: KeyAction[], ID: string) => {
    const oldKey = findKeyById(keys, ID);
    if (!oldKey) {
        throw new Error('Key does not exists');
    }
    return oldKey;
};

export const reactivateKeyAction = ({ keys, ID: targetID, fingerprint, flags }: AddKeyArguments): KeyAction[] => {
    const oldKey = getAndAssertOldKey(keys, targetID);
    if (oldKey.fingerprint !== fingerprint) {
        throw new Error('Fingerprint does not match');
    }
    return keys.map((keyContainer) => {
        if (keyContainer === oldKey) {
            return {
                ...oldKey,
                flags,
            };
        }
        return keyContainer;
    });
};

export const removeKeyAction = ({ keys, ID }: { keys: KeyAction[]; ID: string }) => {
    const oldKey = getAndAssertOldKey(keys, ID);
    return keys.filter((key) => key !== oldKey);
};

export const setPrimaryKeyAction = ({ keys, ID }: { keys: KeyAction[]; ID: string }) => {
    getAndAssertOldKey(keys, ID);
    return keys
        .map((key) => {
            return {
                ...key,
                primary: key.ID === ID ? 1 : 0,
            };
        })
        .sort((a, b) => b.primary - a.primary);
};

export const setFlagsKeyAction = ({ keys, ID, flags }: { keys: KeyAction[]; ID: string; flags: number }) => {
    const oldKey = getAndAssertOldKey(keys, ID);
    return keys.map((key) => {
        if (key === oldKey) {
            return {
                ...key,
                flags,
            };
        }
        return key;
    });
};
