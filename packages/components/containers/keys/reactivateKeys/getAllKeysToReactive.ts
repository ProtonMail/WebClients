import { Address, CachedKey } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { KeyReactivation } from './interface';

const getKeysToReactivate = (keys: CachedKey[] = []) => {
    return keys.filter(({ privateKey }) => !privateKey);
};

export const getKeysToReactivateCount = (inactiveKeys: KeyReactivation[]) => {
    return inactiveKeys.reduce((acc, { keys }) => acc + keys.length, 0);
};

interface Arguments {
    Addresses: Address[];
    User: any;
    userKeysList: CachedKey[];
    addressesKeysMap: { [key: string]: CachedKey[] };
}
export const getAllKeysToReactivate = ({
    Addresses = [],
    addressesKeysMap = {},
    User = {},
    userKeysList = [],
}: Arguments) => {
    const allAddressesKeys = Addresses.map((Address) => {
        const { ID } = Address;
        const addressKeysList = addressesKeysMap[ID];
        const addressKeysToReactivate = getKeysToReactivate(addressKeysList);
        if (!addressKeysToReactivate.length) {
            return;
        }
        return {
            Address,
            keys: addressKeysToReactivate,
        };
    }, []);

    const inactiveUserKeys = getKeysToReactivate(userKeysList);

    return [
        inactiveUserKeys.length
            ? {
                  User,
                  keys: inactiveUserKeys,
              }
            : undefined,
        ...allAddressesKeys,
    ].filter(isTruthy);
};
