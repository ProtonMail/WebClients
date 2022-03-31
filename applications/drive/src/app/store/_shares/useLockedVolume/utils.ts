import { c } from 'ttag';

import {
    CryptoProxy,
    getMatchingSigningKey,
    PrivateKeyReference,
    VERIFICATION_STATUS,
} from '@proton/crypto';
import { concatArrays } from '@proton/crypto/lib/utils';
import { useAddressesKeys } from '@proton/components';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { LockedVolumeForRestore, ShareWithKey } from './../interface';

export const getPossibleAddressPrivateKeys = (addressesKeys: ReturnType<typeof useAddressesKeys>[0]) => {
    if (!addressesKeys?.length) {
        return [];
    }
    /*
        Taking all adress keys and match it by Id with `Keys` array (that's decrypted keys).
        The result here is an array of decrypted private keys associated with any of the given
        address keys.
    */
    return addressesKeys
        .reduce((result: DecryptedKey[], { address, keys }) => {
            return [
                ...result,
                ...address.Keys.map((addressKey) => keys.find((key) => key.ID === addressKey.ID)).filter(isTruthy),
            ];
        }, [])
        .map((decryptedKey) => decryptedKey.privateKey);
};

export async function decryptLockedSharePassphrase(
    oldPrivateKey: PrivateKeyReference,
    lockedShare: ShareWithKey
): Promise<string | undefined> {
    if (!lockedShare.possibleKeyPackets) {
        return;
    }

    const keyPacketsAsUnit8Array = concatArrays(
        lockedShare.possibleKeyPackets.map((keyPacket) => base64StringToUint8Array(keyPacket))
    );
    const sessionKey = await getDecryptedSessionKey({
        data: keyPacketsAsUnit8Array,
        privateKeys: oldPrivateKey,
    });

    const { data: decryptedPassphrase, verified } = await CryptoProxy.decryptMessage({
        armoredMessage: lockedShare.passphrase,
        armoredSignature: lockedShare.passphraseSignature,
        sessionKeys: sessionKey,
        verificationKeys: oldPrivateKey,
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    if (!lockedShare.rootLinkRecoveryPassphrase) {
        return;
    }

    const lockedShareKey = await CryptoProxy.importPrivateKey({
        armoredKey: lockedShare.key,
        passphrase: decryptedPassphrase,
    });
    const shareSessionKey = await getDecryptedSessionKey({
        data: lockedShare.rootLinkRecoveryPassphrase,
        privateKeys: lockedShareKey,
    });
    const { data: shareDecryptedPassphrase } = await CryptoProxy.decryptMessage({
        armoredMessage: lockedShare.rootLinkRecoveryPassphrase,
        sessionKeys: shareSessionKey,
        verificationKeys: lockedShareKey,
    });

    return shareDecryptedPassphrase;
}

export async function prepareVolumeForRestore(
    share: ShareWithKey,
    addressPrivateKeys: PrivateKeyReference[]
): Promise<LockedVolumeForRestore | undefined> {
    try {
        const matchingPrivateKey = (await getMatchingSigningKey({
            armoredSignature: share.passphraseSignature,
            keys: addressPrivateKeys,
        })) as PrivateKeyReference | undefined;

        if (matchingPrivateKey) {
            const decryptedPassphrase = await decryptLockedSharePassphrase(matchingPrivateKey, share);
            if (decryptedPassphrase) {
                return { shareId: share.shareId, lockedVolumeId: share.volumeId, decryptedPassphrase };
            }
        }
    } catch {
        return undefined;
    }
}
