import { c } from 'ttag';

import {
    CryptoProxy,
    PrivateKeyReference,
    SessionKey,
    VERIFICATION_STATUS,
    getMatchingSigningKey,
} from '@proton/crypto';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import isTruthy from '@proton/utils/isTruthy';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { LockedDeviceForRestore, LockedShareForRestore, LockedVolumeForRestore, ShareWithKey } from './../interface';
import { AddressesKeysResult } from './useLockedVolume';

export const getPossibleAddressPrivateKeys = (addressesKeys: AddressesKeysResult) => {
    if (!addressesKeys?.length) {
        return [];
    }
    /*
        Taking all adress keys and match it by Id with `Keys` array (that's decrypted keys).
        The result here is an array of decrypted private keys associated with any of the given
        address keys.
    */
    return addressesKeys
        .reduce((result: DecryptedAddressKey[], { address, keys }) => {
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
): Promise<
    | {
          shareSessionKey: SessionKey;
          shareDecryptedPassphrase: string;
          linkDecryptedPassphrase: string;
      }
    | undefined
> {
    if (!lockedShare.possibleKeyPackets) {
        return;
    }

    const keyPacketsAsUnit8Array = mergeUint8Arrays(
        lockedShare.possibleKeyPackets.map((keyPacket) => base64StringToUint8Array(keyPacket))
    );
    const shareSessionKey = await getDecryptedSessionKey({
        data: keyPacketsAsUnit8Array,
        privateKeys: oldPrivateKey,
    });

    const { data: shareDecryptedPassphrase, verified } = await CryptoProxy.decryptMessage({
        armoredMessage: lockedShare.passphrase,
        armoredSignature: lockedShare.passphraseSignature,
        sessionKeys: shareSessionKey,
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
        passphrase: shareDecryptedPassphrase,
    });
    const linkSessionKey = await getDecryptedSessionKey({
        data: lockedShare.rootLinkRecoveryPassphrase,
        privateKeys: lockedShareKey,
    });
    const { data: linkDecryptedPassphrase } = await CryptoProxy.decryptMessage({
        armoredMessage: lockedShare.rootLinkRecoveryPassphrase,
        sessionKeys: linkSessionKey,
        verificationKeys: lockedShareKey,
    });

    return {
        shareSessionKey,
        shareDecryptedPassphrase,
        linkDecryptedPassphrase,
    };
}

export async function prepareVolumeForRestore(
    defaultShare: ShareWithKey,
    devices: (ShareWithKey & { deviceName?: string })[],
    photos: ShareWithKey[],
    addressPrivateKeys: PrivateKeyReference[]
): Promise<LockedVolumeForRestore | undefined> {
    const preparedDefaultShare = await prepareShareForRestore(defaultShare, addressPrivateKeys);
    if (!preparedDefaultShare) {
        return undefined;
    }

    const preparedDevices = await Promise.all(
        devices.map(async (device) => {
            const preparedShare = await prepareShareForRestore(device, addressPrivateKeys);
            if (!preparedShare) {
                return undefined;
            }
            return preparedShare;
        })
    );
    const preparedPhotos = await Promise.all(
        photos.map(async (photo) => {
            const preparedShare = await prepareShareForRestore(photo, addressPrivateKeys);
            if (!preparedShare) {
                return undefined;
            }
            return preparedShare;
        })
    );
    return {
        lockedVolumeId: defaultShare.volumeId,
        defaultShare: preparedDefaultShare,
        devices: preparedDevices.filter(isTruthy),
        photos: preparedPhotos.filter(isTruthy),
    };
}

async function prepareShareForRestore(
    share: ShareWithKey,
    addressPrivateKeys: PrivateKeyReference[]
): Promise<
    | (LockedShareForRestore & {
          shareSessionKey: LockedDeviceForRestore['shareSessionKey'];
          shareDecryptedPassphrase: LockedDeviceForRestore['shareDecryptedPassphrase'];
      })
    | undefined
> {
    try {
        const matchingPrivateKey = (await getMatchingSigningKey({
            armoredSignature: share.passphraseSignature,
            keys: addressPrivateKeys,
        })) as PrivateKeyReference | undefined;

        if (matchingPrivateKey) {
            const result = await decryptLockedSharePassphrase(matchingPrivateKey, share);
            if (result) {
                return {
                    shareId: share.shareId,
                    shareSessionKey: result.shareSessionKey,
                    shareDecryptedPassphrase: result.shareDecryptedPassphrase,
                    linkDecryptedPassphrase: result.linkDecryptedPassphrase,
                };
            }
        }
    } catch {
        return undefined;
    }
}
