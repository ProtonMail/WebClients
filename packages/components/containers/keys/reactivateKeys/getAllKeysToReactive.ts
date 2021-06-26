import { Address, DecryptedKey, Key, UserModel } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { KeyReactivationRequest } from './interface';

const getKeysToReactivate = (Keys: Key[], keys: DecryptedKey[] = []) => {
    const set = new Set(keys.map(({ ID }) => ID));
    return Keys.filter((Key) => {
        return !set.has(Key.ID);
    });
};

export const getKeysToReactivateCount = (inactiveKeys: KeyReactivationRequest[]) => {
    return inactiveKeys.reduce((acc, { keysToReactivate }) => acc + keysToReactivate.length, 0);
};

export const getAllKeysReactivationRequests = (
    addressesKeys: { address: Address; keys: DecryptedKey[] }[],
    User: UserModel,
    userKeys: DecryptedKey[]
): KeyReactivationRequest[] => {
    const allAddressesKeys = addressesKeys.map(({ address, keys }) => {
        const inactiveAddressKeys = getKeysToReactivate(address.Keys, keys);
        if (!inactiveAddressKeys.length) {
            return;
        }
        return {
            address,
            keys,
            keysToReactivate: inactiveAddressKeys,
        };
    });

    const inactiveUserKeys = getKeysToReactivate(User.Keys, userKeys);
    const userKeysReactivation = inactiveUserKeys.length
        ? {
              user: User,
              keys: userKeys,
              keysToReactivate: inactiveUserKeys,
          }
        : undefined;

    return [userKeysReactivation, ...allAddressesKeys].filter(isTruthy);
};
