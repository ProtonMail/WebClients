import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import isTruthy from '@proton/utils/isTruthy';
import { ActiveKey, DecryptedKey, Key, SignedKeyList } from '../interfaces';
import { KEY_FLAG } from '../constants';
import { clearBit } from '../helpers/bitset';
import { getParsedSignedKeyList, getSignedKeyListMap } from './signedKeyList';
import { getDefaultKeyFlags } from './keyFlags';

export const getPrimaryFlag = (keys: ActiveKey[]): 1 | 0 => {
    return !keys.length ? 1 : 0;
};

// When a key is disabled, the NOT_OBSOLETE flag is removed. Thus when the key is reactivated, the client uses the old key flags, with the not obsolete flag removed. This is mainly to take into account the old NOT_COMPROMISED flag
export const getReactivatedKeyFlag = (Flags?: number) => {
    return clearBit(Flags ?? getDefaultKeyFlags(), KEY_FLAG.FLAG_NOT_OBSOLETE);
};

export const getActiveKeyObject = async (
    privateKey: PrivateKeyReference,
    partial: Partial<ActiveKey> & { ID: string }
): Promise<ActiveKey> => {
    const publicKey = await CryptoProxy.importPublicKey({
        binaryKey: await CryptoProxy.exportPublicKey({ key: privateKey, format: 'binary' }),
    });
    return {
        privateKey,
        publicKey,
        flags: getDefaultKeyFlags(),
        primary: 0,
        fingerprint: privateKey.getFingerprint(),
        sha256Fingerprints: await CryptoProxy.getSHA256Fingerprints({ key: privateKey }),
        ...partial,
    };
};

export const getActiveKeys = async (
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
                flags: signedKeyListItem?.Flags ?? Key?.Flags ?? getDefaultKeyFlags(),
            });
        })
    );

    return result.filter(isTruthy);
};
