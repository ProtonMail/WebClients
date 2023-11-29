import { CryptoProxy } from '@proton/crypto';
import getRandomString from '@proton/utils/getRandomString';
import isTruthy from '@proton/utils/isTruthy';

import type { Address, DecryptedKey, InactiveKey, Key, User } from '../interfaces';
import type {
    KeyReactivationRequest,
    KeyReactivationRequestState,
    KeyReactivationRequestStateData,
} from './reactivation/interface';

export const getInactiveKeys = async (Keys: Key[], decryptedKeys: DecryptedKey[]): Promise<InactiveKey[]> => {
    const decryptedKeysIDs = new Set<string>(decryptedKeys.map(({ ID }) => ID));
    const inactiveKeys = Keys.filter(({ ID }) => !decryptedKeysIDs.has(ID));
    return Promise.all(
        inactiveKeys.map(async (Key) => {
            const { fingerprint } = await CryptoProxy.getKeyInfo({ armoredKey: Key.PrivateKey }).catch(() => ({
                fingerprint: undefined,
            }));
            return {
                Key,
                fingerprint: fingerprint || Key.Fingerprint,
            };
        })
    );
};

export const getAllKeysReactivationRequests = ({
    addresses,
    user,
    inactiveKeys,
}: {
    addresses: Address[] | undefined;
    user: User | undefined;
    inactiveKeys: { user: InactiveKey[]; addresses: { [key: string]: InactiveKey[] | undefined } };
}): KeyReactivationRequest[] => {
    const allAddressesKeys = (addresses || []).map((address) => {
        const inactiveAddressKeys = inactiveKeys.addresses[address.ID];
        if (!inactiveAddressKeys?.length) {
            return;
        }
        return {
            address,
            keysToReactivate: inactiveAddressKeys || [],
        };
    });

    const userKeysReactivation =
        user && inactiveKeys.user.length
            ? {
                  user: user,
                  keysToReactivate: inactiveKeys.user,
              }
            : undefined;

    return [userKeysReactivation, ...allAddressesKeys].filter(isTruthy);
};

export const getLikelyHasKeysToReactivate = (user: User, addresses?: Address[]) => {
    return (
        user?.Keys?.some((Key) => !Key.Active) || addresses?.some((address) => address.Keys?.some((Key) => !Key.Active))
    );
};

export const getInitialStates = (initial: KeyReactivationRequest[]): KeyReactivationRequestState[] => {
    if (initial.length === 0) {
        throw new Error('Keys to reactivate needed');
    }

    return initial.map((record) => {
        const keyStates = record.keysToReactivate.map((Key): KeyReactivationRequestStateData => {
            return {
                id: getRandomString(12),
                Key: Key.Key,
                fingerprint: Key.fingerprint || '-',
                result: undefined,
            };
        });
        return {
            ...record,
            keysToReactivate: keyStates,
        };
    });
};
