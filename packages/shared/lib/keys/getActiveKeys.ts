import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import isTruthy from '@proton/utils/isTruthy';

import { ADDRESS_TYPE, KEY_FLAG } from '../constants';
import { clearBit, setBit } from '../helpers/bitset';
import { ActiveKey, Address, DecryptedKey, Key, SignedKeyList } from '../interfaces';
import { getDefaultKeyFlags } from './keyFlags';
import { getParsedSignedKeyList, getSignedKeyListMap } from './signedKeyList';

export const getPrimaryFlag = (keys: ActiveKey[]): 1 | 0 => {
    return !keys.length ? 1 : 0;
};

// When a key is disabled, the NOT_OBSOLETE flag is removed. Thus when the key is reactivated, the client uses the old key flags, with the not obsolete flag removed. This is mainly to take into account the old NOT_COMPROMISED flag
export const getReactivatedKeyFlag = (address: Address, Flags: number | undefined) => {
    return clearBit(Flags ?? getDefaultKeyFlags(address), KEY_FLAG.FLAG_NOT_OBSOLETE);
};

export const getActiveKeyObject = async (
    privateKey: PrivateKeyReference,
    partial: Partial<ActiveKey> & { ID: string } & Pick<ActiveKey, 'flags'>
): Promise<ActiveKey> => {
    const publicKey = await CryptoProxy.importPublicKey({
        binaryKey: await CryptoProxy.exportPublicKey({ key: privateKey, format: 'binary' }),
    });
    return {
        privateKey,
        publicKey,
        primary: 0,
        fingerprint: privateKey.getFingerprint(),
        sha256Fingerprints: await CryptoProxy.getSHA256Fingerprints({ key: privateKey }),
        ...partial,
    };
};

export const getActiveKeys = async (
    address: Address | undefined,
    signedKeyList: SignedKeyList | null | undefined,
    keys: Key[],
    decryptedKeys: DecryptedKey[]
): Promise<ActiveKey[]> => {
    if (!decryptedKeys.length) {
        return [];
    }

    const signedKeyListMap = getSignedKeyListMap(getParsedSignedKeyList(signedKeyList?.Data));
    const keysMap = keys.reduce<{ [key: string]: Key | undefined }>((acc, key) => {
        acc[key.ID] = key;
        return acc;
    }, {});

    const result = await Promise.all(
        decryptedKeys.map(async ({ ID, privateKey }, index) => {
            const fingerprint = privateKey.getFingerprint();
            const Key = keysMap[ID];
            const signedKeyListItem = signedKeyListMap[fingerprint];
            return getActiveKeyObject(privateKey, {
                ID,
                primary: signedKeyListItem?.Primary ?? Key?.Primary ?? index === 0 ? 1 : 0,
                // SKL may not exist for non-migrated users, fall back to the flag value of the key.
                // Should be improved by asserting SKLs for migrated users, but pushed to later since SKL
                // signatures are not verified.
                flags: signedKeyListItem?.Flags ?? Key?.Flags ?? getDefaultKeyFlags(address),
            });
        })
    );

    return result.filter(isTruthy);
};

export const getNormalizedActiveKeys = (address: Address | undefined, keys: ActiveKey[]): ActiveKey[] => {
    return keys
        .sort((a, b) => b.primary - a.primary)
        .map((result, index) => {
            let flags = result.flags;
            if (address?.Type === ADDRESS_TYPE.TYPE_EXTERNAL) {
                flags = setBit(flags, KEY_FLAG.FLAG_EXTERNAL);
            } else {
                flags = clearBit(flags, KEY_FLAG.FLAG_EXTERNAL);
            }
            return {
                ...result,
                // Reset and normalize the primary key. The primary values can be doubly set to 1 if an old SKL is used.
                primary: index === 0 ? 1 : 0,
                flags,
            };
        });
};
