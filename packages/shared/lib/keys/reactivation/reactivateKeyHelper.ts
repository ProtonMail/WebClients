import { getKeys, OpenPGPKey } from 'pmcrypto';
import { User as tsUser, Address as tsAddress, KeyPair, SignedKeyList, DecryptedKey, Key } from '../../interfaces';

import { unique } from '../../helpers/array';

import { getDecryptedAddressKeysHelper } from '../getDecryptedAddressKeys';
import { getSignedKeyList } from '../signedKeyList';
import { getActiveKeys, getReactivatedKeyFlag } from '../getActiveKeys';

interface GetReactivatedAddressKeys {
    address: tsAddress;
    oldUserKeys: KeyPair[];
    newUserKeys: KeyPair[];
    user: tsUser;
    keyPassword: string;
}

type GetReactivateAddressKeysReturnValue =
    | {
          address: tsAddress;
          reactivatedKeys?: undefined;
          signedKeyList?: undefined;
      }
    | {
          address: tsAddress;
          reactivatedKeys: DecryptedKey[];
          signedKeyList: SignedKeyList;
      };

export const getReactivatedAddressKeys = async ({
    address,
    user,
    oldUserKeys,
    newUserKeys,
    keyPassword,
}: GetReactivatedAddressKeys): Promise<GetReactivateAddressKeysReturnValue> => {
    const empty = {
        address,
        reactivatedKeys: undefined,
        signedKeyList: undefined,
    } as const;

    const oldDecryptedAddressKeys = await getDecryptedAddressKeysHelper(address.Keys, user, oldUserKeys, keyPassword);

    // All keys were able to decrypt previously, can just return.
    if (oldDecryptedAddressKeys.length === address.Keys.length) {
        return empty;
    }
    const newDecryptedAddressKeys = await getDecryptedAddressKeysHelper(address.Keys, user, newUserKeys, keyPassword);

    // No difference in how many keys were able to get decrypted
    if (oldDecryptedAddressKeys.length === newDecryptedAddressKeys.length) {
        return empty;
    }
    if (newDecryptedAddressKeys.length < oldDecryptedAddressKeys.length) {
        throw new Error('More old decryptable keys than new, should never happen');
    }

    // New keys were able to get decrypted
    const oldDecryptedAddressKeysSet = new Set<string>(oldDecryptedAddressKeys.map(({ ID }) => ID));
    const reactivatedKeys = newDecryptedAddressKeys.filter(({ ID }) => !oldDecryptedAddressKeysSet.has(ID));
    const reactivatedKeysSet = new Set<string>(reactivatedKeys.map(({ ID }) => ID));

    if (!reactivatedKeysSet.size) {
        return empty;
    }

    const oldAddressKeysMap = new Map<string, Key>(address.Keys.map((Key) => [Key.ID, Key]));
    const newActiveKeys = await getActiveKeys(address.SignedKeyList, address.Keys, newDecryptedAddressKeys);
    const newActiveKeysFormatted = newActiveKeys.map((activeKey) => {
        if (!reactivatedKeysSet.has(activeKey.ID)) {
            return activeKey;
        }
        return {
            ...activeKey,
            flags: getReactivatedKeyFlag(oldAddressKeysMap.get(activeKey.ID)?.Flags),
        };
    });

    return {
        address,
        reactivatedKeys,
        signedKeyList: await getSignedKeyList(newActiveKeysFormatted),
    };
};

export const getAddressReactivationPayload = (results: GetReactivateAddressKeysReturnValue[]) => {
    const AddressKeyFingerprints = unique(
        results.reduce<KeyPair[]>((acc, { reactivatedKeys }) => {
            if (!reactivatedKeys) {
                return acc;
            }
            return acc.concat(reactivatedKeys);
        }, [])
    ).map(({ privateKey }) => privateKey.getFingerprint());

    const SignedKeyLists = results.reduce<{ [key: string]: SignedKeyList }>((acc, result) => {
        if (!result.reactivatedKeys?.length || !result.signedKeyList) {
            throw new Error('Missing reactivated keys');
        }
        acc[result.address.ID] = result.signedKeyList;
        return acc;
    }, {});

    return {
        AddressKeyFingerprints,
        SignedKeyLists,
    };
};

interface GetReactivatedAddressesKeys {
    addresses: tsAddress[];
    oldUserKeys: KeyPair[];
    newUserKeys: KeyPair[];
    user: tsUser;
    keyPassword: string;
}

export const getReactivatedAddressesKeys = async ({
    addresses,
    oldUserKeys,
    newUserKeys,
    user,
    keyPassword,
}: GetReactivatedAddressesKeys) => {
    const promises = addresses.map((address) =>
        getReactivatedAddressKeys({
            address,
            oldUserKeys,
            newUserKeys,
            user,
            keyPassword,
        })
    );
    const results = await Promise.all(promises);
    return results.filter(({ reactivatedKeys }) => {
        if (!reactivatedKeys) {
            return false;
        }
        return reactivatedKeys.length > 0;
    });
};

export const resetUserId = async (Key: Key, reactivatedKey: OpenPGPKey) => {
    // Before the new key format imposed after key migration, the address and user key were the same key.
    // Users may have exported one of the two. Upon reactivation the fingerprint could match a user key
    // to the corresponding address key or vice versa. For that reason, the userids are reset to the userids
    // of the old key.
    const [inactiveKey] = await getKeys(Key.PrivateKey);
    // Warning: This function mutates the key.
    reactivatedKey.users = inactiveKey.users;
};
