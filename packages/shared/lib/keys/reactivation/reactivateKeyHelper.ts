import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import unique from '@proton/utils/unique';

import {
    DecryptedKey,
    Key,
    KeyPair,
    KeyTransparencyVerify,
    SignedKeyList,
    Address as tsAddress,
    User as tsUser,
} from '../../interfaces';
import { getActiveKeys, getNormalizedActiveKeys, getReactivatedKeyFlag } from '../getActiveKeys';
import { getDecryptedAddressKeysHelper } from '../getDecryptedAddressKeys';
import { OnSKLPublishSuccess, getSignedKeyListWithDeferredPublish } from '../signedKeyList';

interface GetReactivatedAddressKeys {
    address: tsAddress;
    oldUserKeys: KeyPair[];
    newUserKeys: KeyPair[];
    user: tsUser;
    keyPassword: string;
    keyTransparencyVerify: KeyTransparencyVerify;
}

type GetReactivateAddressKeysReturnValue =
    | {
          address: tsAddress;
          reactivatedKeys?: undefined;
          signedKeyList?: undefined;
          onSKLPublishSuccess?: undefined;
      }
    | {
          address: tsAddress;
          reactivatedKeys: DecryptedKey[];
          signedKeyList: SignedKeyList;
          onSKLPublishSuccess: OnSKLPublishSuccess;
      };

export const getReactivatedAddressKeys = async ({
    address,
    user,
    oldUserKeys,
    newUserKeys,
    keyPassword,
    keyTransparencyVerify,
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
    const newActiveKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, newDecryptedAddressKeys);
    const newActiveKeysFormatted = getNormalizedActiveKeys(
        address,
        newActiveKeys.map((activeKey) => {
            if (!reactivatedKeysSet.has(activeKey.ID)) {
                return activeKey;
            }
            return {
                ...activeKey,
                flags: getReactivatedKeyFlag(address, oldAddressKeysMap.get(activeKey.ID)?.Flags),
            };
        })
    );
    const [signedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        newActiveKeysFormatted,
        address,
        keyTransparencyVerify
    );
    return {
        address,
        reactivatedKeys,
        signedKeyList: signedKeyList,
        onSKLPublishSuccess: onSKLPublishSuccess,
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
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const getReactivatedAddressesKeys = async ({
    addresses,
    oldUserKeys,
    newUserKeys,
    user,
    keyPassword,
    keyTransparencyVerify,
}: GetReactivatedAddressesKeys) => {
    const promises = addresses.map((address) =>
        getReactivatedAddressKeys({
            address,
            oldUserKeys,
            newUserKeys,
            user,
            keyPassword,
            keyTransparencyVerify,
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

export const resetUserId = async (Key: Key, reactivatedKey: PrivateKeyReference) => {
    // Before the new key format imposed after key migration, the address and user key were the same key.
    // Users may have exported one of the two. Upon reactivation the fingerprint could match a user key
    // to the corresponding address key or vice versa. For that reason, the userids are reset to the userids
    // of the old key.
    const inactiveKey = await CryptoProxy.importPublicKey({ armoredKey: Key.PrivateKey });
    // Warning: This function mutates the target key.
    await CryptoProxy.replaceUserIDs({ sourceKey: inactiveKey, targetKey: reactivatedKey });
};
