import { OpenPGPKey } from 'pmcrypto';
import { CachedKey, ActionableKey } from '../interfaces';

export interface AddKeyArguments {
    ID: string;
    flags: number;
    parsedKeys: CachedKey[];
    actionableKeys: ActionableKey[];
    privateKey: OpenPGPKey;
}
export const addKeyAction = ({
    parsedKeys,
    actionableKeys,
    ID: newKeyID,
    privateKey,
    flags,
}: AddKeyArguments): ActionableKey[] => {
    if (parsedKeys.find(({ Key: { ID } }) => ID === newKeyID)) {
        throw new Error('Key already exists');
    }

    const newKey: ActionableKey = {
        ID: newKeyID,
        primary: !parsedKeys.length ? 1 : 0,
        flags,
        privateKey,
    };

    return [...actionableKeys, newKey];
};

export const reactivateKeyAction = ({
    parsedKeys,
    actionableKeys,
    ID: targetID,
    privateKey,
    flags,
}: AddKeyArguments): ActionableKey[] => {
    const oldKey = parsedKeys.find(({ Key: { ID } }) => ID === targetID);
    if (!oldKey) {
        throw new Error('Key not found');
    }
    if (actionableKeys.find(({ ID }) => ID === targetID)) {
        throw new Error('Key already active');
    }

    const newKey: ActionableKey = {
        ID: oldKey.Key.ID,
        primary: !parsedKeys.length ? 1 : 0,
        flags,
        privateKey,
    };

    return [...actionableKeys, newKey];
};

export const removeKeyAction = ({ actionableKeys, ID }: { actionableKeys: ActionableKey[]; ID: string }) => {
    return actionableKeys.filter((key) => key.ID !== ID);
};

export const setPrimaryKeyAction = ({
    actionableKeys,
    ID: targetID,
}: {
    actionableKeys: ActionableKey[];
    ID: string;
}) => {
    // Ensure it exists, can only set primary if it's decrypted
    if (!actionableKeys.find(({ ID }) => ID === targetID)) {
        throw new Error('Key not found');
    }
    return actionableKeys
        .map((key) => {
            return {
                ...key,
                primary: key.ID === targetID ? 1 : 0,
            };
        })
        .sort((a, b) => b.primary - a.primary);
};

export const setFlagsKeyAction = ({
    actionableKeys,
    ID,
    flags,
}: {
    actionableKeys: ActionableKey[];
    ID: string;
    flags: number;
}): ActionableKey[] => {
    return actionableKeys.map((key) => {
        if (key.ID === ID) {
            return {
                ...key,
                flags,
            };
        }
        return key;
    });
};
