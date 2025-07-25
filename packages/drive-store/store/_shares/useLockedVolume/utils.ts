import { c } from 'ttag';

import type { PrivateKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS, getMatchingSigningKey } from '@proton/crypto';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type { DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { VolumeType } from '@proton/shared/lib/interfaces/drive/volume';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import isTruthy from '@proton/utils/isTruthy';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import type {
    LockedDeviceForRestore,
    LockedShareForRestore,
    LockedVolumeForRestore,
    ShareWithKey,
} from './../interface';
import type { AddressesKeysResult } from './useLockedVolume';

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

    const { data: shareDecryptedPassphrase, verificationStatus } = await CryptoProxy.decryptMessage({
        armoredMessage: lockedShare.passphrase,
        armoredSignature: lockedShare.passphraseSignature,
        sessionKeys: shareSessionKey,
        verificationKeys: oldPrivateKey,
    });

    if (verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
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
    defaultShares: ShareWithKey[],
    devices: (ShareWithKey & { deviceName?: string })[],
    photos: ShareWithKey[],
    addressPrivateKeys: PrivateKeyReference[]
): Promise<LockedVolumeForRestore | undefined> {
    const preparedDefaultShares = await Promise.all(
        defaultShares.map(async (defaultShare) => {
            const preparedShare = await prepareShareForRestore(defaultShare, addressPrivateKeys);
            return preparedShare;
        })
    );

    const validPreparedDefaultShares = preparedDefaultShares.filter(isTruthy);
    if (!validPreparedDefaultShares.length) {
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
        lockedVolumeId: defaultShares[0].volumeId,
        defaultShares: validPreparedDefaultShares,
        devices: preparedDevices.filter(isTruthy),
        photos: preparedPhotos.filter(isTruthy),
    };
}

async function prepareShareForRestore(
    share: ShareWithKey,
    addressPrivateKeys: PrivateKeyReference[]
): Promise<
    | (LockedShareForRestore & {
          isPhotosVolume: boolean;
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

        if (!matchingPrivateKey) {
            throw new Error('No matching private key found for lockedShare');
        }

        const result = await decryptLockedSharePassphrase(matchingPrivateKey, share);
        if (!result) {
            throw new Error('Failed to decrypt lockedShare passphrase');
        }

        return {
            isPhotosVolume: share.volumeType === VolumeType.Photos,
            shareId: share.shareId,
            shareSessionKey: result.shareSessionKey,
            shareDecryptedPassphrase: result.shareDecryptedPassphrase,
            linkDecryptedPassphrase: result.linkDecryptedPassphrase,
        };
    } catch (e: unknown) {
        return undefined;
    }
}
