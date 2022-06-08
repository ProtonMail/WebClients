import { c } from 'ttag';
import {
    concatArrays,
    decryptMessage,
    decryptPrivateKey,
    getMessage,
    getSignature,
    OpenPGPKey,
    VERIFICATION_STATUS,
    getMatchingKey,
} from 'pmcrypto';

import { useAddressesKeys } from '@proton/components';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/util/isTruthy';

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
    oldPrivateKey: OpenPGPKey,
    lockedShare: ShareWithKey
): Promise<string | undefined> {
    if (!lockedShare.possibleKeyPackets) {
        return;
    }

    const keyPacketsAsUnit8Array = concatArrays(
        lockedShare.possibleKeyPackets.map((keyPacket) => base64StringToUint8Array(keyPacket))
    );
    const sessionKey = await getDecryptedSessionKey({
        data: await getMessage(keyPacketsAsUnit8Array),
        privateKeys: oldPrivateKey,
    });

    const { data: decryptedPassphrase, verified } = await decryptMessage({
        message: await getMessage(lockedShare.passphrase),
        signature: await getSignature(lockedShare.passphraseSignature),
        sessionKeys: sessionKey,
        publicKeys: oldPrivateKey.toPublic(),
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    if (!lockedShare.rootLinkRecoveryPassphrase) {
        return;
    }

    const lockedShareKey = await decryptPrivateKey(lockedShare.key, decryptedPassphrase);
    const shareSessionKey = await getDecryptedSessionKey({
        data: await getMessage(lockedShare.rootLinkRecoveryPassphrase),
        privateKeys: lockedShareKey,
    });
    const { data: shareDecryptedPassphrase } = await decryptMessage({
        message: await getMessage(lockedShare.rootLinkRecoveryPassphrase),
        sessionKeys: shareSessionKey,
        publicKeys: lockedShareKey.toPublic(),
    });

    return shareDecryptedPassphrase;
}

export async function prepareVolumeForRestore(
    share: ShareWithKey,
    addressPrivateKeys: OpenPGPKey[]
): Promise<LockedVolumeForRestore | undefined> {
    try {
        const signature = await getSignature(share.passphraseSignature);
        const matchingPrivateKey = await getMatchingKey(signature, addressPrivateKeys);

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
