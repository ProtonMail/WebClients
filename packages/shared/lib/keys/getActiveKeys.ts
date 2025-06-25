import type { PrivateKeyReferenceV4, PrivateKeyReferenceV6, PublicKeyReference } from '@proton/crypto';

import { KEY_FLAG } from '../constants';
import { clearBit } from '../helpers/bitset';
import type { DecryptedAddressKey } from '../interfaces';
import {
    type ActiveAddressKeysByVersion,
    type ActiveKey,
    type ActiveKeyWithVersion,
    type Address,
    type DecryptedKey,
    type Key,
    type SignedKeyList,
    isActiveKeyV6,
} from '../interfaces';
import { getDefaultKeyFlags } from './keyFlags';
import { ParsedSignedKeyList } from './signedKeyList';

export const getPrimaryFlag = (keys: ActiveKey[]): 1 | 0 => {
    return !keys.length ? 1 : 0;
};

// When a key is disabled, the NOT_OBSOLETE flag is removed. Thus when the key is reactivated, the client uses the old key flags, with the not obsolete flag removed. This is mainly to take into account the old NOT_COMPROMISED flag
export const getReactivatedKeyFlag = (address: Address, Flags: number | undefined) => {
    return clearBit(Flags ?? getDefaultKeyFlags(address), KEY_FLAG.FLAG_NOT_OBSOLETE);
};

export const getActiveKeyObject = async <
    PrivateKeyReferenceWithVersion extends PrivateKeyReferenceV4 | PrivateKeyReferenceV6,
>(
    privateKey: PrivateKeyReferenceWithVersion,
    publicKey: PublicKeyReference,
    partial: Partial<ActiveKey> & { ID: string } & Pick<ActiveKey, 'flags'>
): Promise<ActiveKey<PrivateKeyReferenceWithVersion>> => {
    return {
        privateKey,
        publicKey,
        primary: 0,
        fingerprint: privateKey.getFingerprint(),
        sha256Fingerprints: privateKey.getSHA256Fingerprints(),
        ...partial,
    } as ActiveKey<PrivateKeyReferenceWithVersion>;
};

export const getActiveAddressKeys = async (
    signedKeyList: SignedKeyList | null | undefined,
    decryptedKeys: DecryptedAddressKey[]
): Promise<ActiveAddressKeysByVersion> => {
    if (!decryptedKeys.length) {
        return { v4: [], v6: [] };
    }

    const parsedSignedKeyList = new ParsedSignedKeyList(signedKeyList?.Data);
    const decryptedKeysIDsWithFingerprints = await Promise.all(
        decryptedKeys.map(async (decryptedKey) => ({
            ID: decryptedKey.ID,
            sha256Fingerprints: decryptedKey.privateKey.getSHA256Fingerprints(),
        }))
    );
    const keyIDsToSKLItemsMap = parsedSignedKeyList.mapAddressKeysToSKLItems(decryptedKeysIDsWithFingerprints);

    const isV6Key = (
        key: DecryptedAddressKey<PrivateKeyReferenceV6> | DecryptedKey<PrivateKeyReferenceV4>
    ): key is DecryptedAddressKey<PrivateKeyReferenceV6> => key.privateKey.isPrivateKeyV6();
    const decryptedKeysByVersion = (
        decryptedKeys as (DecryptedAddressKey<PrivateKeyReferenceV6> | DecryptedAddressKey<PrivateKeyReferenceV4>)[]
    ).reduce<{ v4: DecryptedAddressKey<PrivateKeyReferenceV4>[]; v6: DecryptedAddressKey<PrivateKeyReferenceV6>[] }>(
        (prev, curr) => {
            if (isV6Key(curr)) {
                prev.v6.push(curr);
            } else {
                prev.v4.push(curr);
            }
            return prev;
        },
        { v4: [], v6: [] }
    );

    const decryptedKeyToActiveKey = async <KeyVersion extends PrivateKeyReferenceV4 | PrivateKeyReferenceV6>({
        ID,
        privateKey,
        publicKey,
        Primary,
        Flags,
    }: DecryptedAddressKey<KeyVersion>): Promise<ActiveKey<KeyVersion>> => {
        const signedKeyListItem = keyIDsToSKLItemsMap[ID];
        return getActiveKeyObject(privateKey, publicKey, {
            ID,
            primary: signedKeyListItem?.Primary ?? Primary,
            // SKL may not exist for non-migrated users, fall back to the flag value of the key.
            // Should be improved by asserting SKLs for migrated users, but pushed to later since SKL
            // signatures are not verified.
            flags: signedKeyListItem?.Flags ?? Flags,
        }) as Promise<ActiveKey<KeyVersion>>;
    };

    return {
        v4: await Promise.all(decryptedKeysByVersion.v4.map(decryptedKeyToActiveKey)),
        v6: await Promise.all(decryptedKeysByVersion.v6.map(decryptedKeyToActiveKey)),
    };
};

export const getActiveUserKeys = async (keys: Key[], decryptedKeys: DecryptedKey[]): Promise<ActiveKey[]> => {
    if (!decryptedKeys.length) {
        return [];
    }

    const keysMap = keys.reduce<{ [key: string]: Key | undefined }>((acc, key) => {
        acc[key.ID] = key;
        return acc;
    }, {});

    const decryptedKeyToActiveKey = async ({ ID, privateKey, publicKey }: DecryptedKey, index: number) => {
        const Key = keysMap[ID];
        const defaultPrimaryValue = index === 0 ? 1 : 0;
        return getActiveKeyObject(privateKey as PrivateKeyReferenceV4 | PrivateKeyReferenceV6, publicKey, {
            ID,
            primary: Key?.Primary ?? defaultPrimaryValue,
            flags: Key?.Flags ?? getDefaultKeyFlags(undefined),
        });
    };

    return Promise.all(decryptedKeys.map(decryptedKeyToActiveKey));
};

/**
 * Normalize the given `keys` by setting the primary flag appropriately,
 * ensuring at most one primary key is set for each version (v6 keys might not have any primary key set).
 * @return normalized active keys where the first entry for each version is the primary key,
 * if it exists.
 */
export const getNormalizedActiveAddressKeys = (address: Address | undefined, keys: ActiveAddressKeysByVersion) => {
    const normalize = <V extends ActiveKeyWithVersion>(result: V, index: number): V => ({
        ...result,
        // Reset and normalize the primary key. The primary values can be doubly set to 1 if an old SKL is used.
        // v6 keys might not have any primary key set
        primary: isActiveKeyV6(result) ? (index === 0 ? result.primary : 0) : index === 0 ? 1 : 0,
    });
    const normalized: ActiveAddressKeysByVersion = {
        v4: keys.v4.sort((a, b) => b.primary - a.primary).map(normalize),
        v6: keys.v6.sort((a, b) => b.primary - a.primary).map(normalize),
    };

    return normalized;
};

export const getNormalizedActiveUserKeys = (address: Address | undefined, keys: ActiveKey[]) => {
    const normalize = (result: ActiveKey, index: number): ActiveKey => ({
        ...result,
        // Reset and normalize the primary key. For user key, there is always a single primary key (either v4 or v6)
        primary: index === 0 ? 1 : 0,
    });

    return keys.sort((a, b) => b.primary - a.primary).map(normalize);
};
