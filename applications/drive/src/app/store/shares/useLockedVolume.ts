import { format } from 'date-fns';
import { useCallback } from 'react';
import { c } from 'ttag';
import {
    concatArrays,
    decryptMessage,
    decryptPrivateKey,
    encryptMessage,
    getMessage,
    getSignature,
    OpenPGPKey,
    getMatchingKey,
    VERIFICATION_STATUS,
} from 'pmcrypto';

import { usePreventLeave, useAddressesKeys } from '@proton/components';
import { Address, DecryptedKey } from '@proton/shared/lib/interfaces';
import { dateLocale } from '@proton/shared/lib/i18n';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { generateLookupHash, encryptPassphrase } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import { queryRestoreDriveVolume, queryDeleteLockedVolumes } from '@proton/shared/lib/api/drive/volume';

import { useDebouncedRequest } from '../api';
import { useDriveCrypto } from '../crypto';
import { useLink } from '../links';
import { GLOBAL_FORBIDDEN_CHARACTERS } from '../links/link';
import useShare from './useShare';
import useDefaultShare from './useDefaultShare';
import useSharesState from './useSharesState';
import { ShareWithKey, LockedVolumeForRestore } from './interface';

/**
 * useLockedVolume provides actions to delete or recover files from locked volumes.
 */
export default function useLockedVolume() {
    const { preventLeave } = usePreventLeave();
    const [addressesKeys] = useAddressesKeys();
    const debouncedRequest = useDebouncedRequest();
    const { getLinkPrivateKey, getLinkHashKey } = useLink();
    const { getPrimaryAddressKey } = useDriveCrypto();
    const { getShareWithKey } = useShare();
    const { getDefaultShare } = useDefaultShare();
    const { removeShares, getLockedShares, setLockedVolumesForRestore, lockedVolumesForRestore } = useSharesState();

    const getPossibleAddressPrivateKeys = useCallback(() => {
        if (!addressesKeys?.length) {
            return [];
        }
        const possibleAddressKeys = addressesKeys.reduce((result: DecryptedKey[], { address, keys }) => {
            return [
                ...result,
                ...address.Keys.map((addressKey) => keys.find((key) => key.ID === addressKey.ID)).filter(isTruthy),
            ];
        }, []);
        return possibleAddressKeys.map(({ privateKey }) => privateKey);
    }, [addressesKeys]);

    const getLoadedLockedShares = useCallback(
        async (abortSignal: AbortSignal) => {
            return Promise.all(getLockedShares().map(({ shareId }) => getShareWithKey(abortSignal, shareId)));
        },
        [getLockedShares, getShareWithKey]
    );

    const prepareVolumesForRestore = useCallback(
        async (abortSignal: AbortSignal): Promise<LockedVolumeForRestore[]> => {
            const addressPrivateKeys = getPossibleAddressPrivateKeys();
            const lockedShares = await getLoadedLockedShares(abortSignal);
            return (
                await Promise.all(lockedShares.map(async (share) => prepareVolumeForRestore(share, addressPrivateKeys)))
            ).filter(isTruthy);
        },
        [getPossibleAddressPrivateKeys, getLockedShares]
    );

    const getVolumesForRestore = useCallback(
        async (abortSignal: AbortSignal): Promise<LockedVolumeForRestore[]> => {
            if (lockedVolumesForRestore) {
                return lockedVolumesForRestore;
            }
            const volumes = await prepareVolumesForRestore(abortSignal);
            setLockedVolumesForRestore(volumes);
            return volumes;
        },
        [lockedVolumesForRestore, prepareVolumesForRestore]
    );

    const restoreVolume = async (
        parentVolumeID: string,
        privateKey: OpenPGPKey,
        hashKey: string,
        addressKey: OpenPGPKey,
        address: Address,
        lockedVolumeId: string,
        lockedSharePassphraseRaw: string
    ) => {
        if (!hashKey) {
            throw new Error('Missing hash key on folder link');
        }

        const formattedDate = format(new Date(), 'Ppp', { locale: dateLocale }).replaceAll(
            RegExp(GLOBAL_FORBIDDEN_CHARACTERS, 'g'),
            ' '
        );
        const restoreFolderName = `Restored files ${formattedDate}`;

        const [Hash, { NodePassphrase, NodePassphraseSignature }, { data: encryptedName }] = await Promise.all([
            generateLookupHash(restoreFolderName, hashKey),
            encryptPassphrase(privateKey, addressKey, lockedSharePassphraseRaw),
            encryptMessage({
                data: restoreFolderName,
                publicKeys: privateKey.toPublic(),
                privateKeys: addressKey,
            }),
        ]);

        await debouncedRequest(
            queryRestoreDriveVolume(lockedVolumeId, {
                Name: encryptedName,
                SignatureAddress: address.Email,
                Hash,
                NodePassphrase,
                NodePassphraseSignature,
                TargetVolumeID: parentVolumeID,
            })
        );
    };

    const restoreVolumes = async (abortSignal: AbortSignal, readyToRestoreList?: LockedVolumeForRestore[]) => {
        const defaultShare = await getDefaultShare(abortSignal);
        const lockedVolumesForRestore = readyToRestoreList || (await getVolumesForRestore(abortSignal));
        if (!defaultShare || !lockedVolumesForRestore.length) {
            return;
        }

        const [privateKey, hashKey, { privateKey: addressKey, address }] = await Promise.all([
            getLinkPrivateKey(abortSignal, defaultShare.shareId, defaultShare.rootLinkId),
            getLinkHashKey(abortSignal, defaultShare.shareId, defaultShare.rootLinkId),
            getPrimaryAddressKey(),
        ]);

        // Backend does not support restoring of multiple volumes at one time.
        // Resotring is async operation and user has to trigger it for the next
        // volume manualy later again.
        const restorePromiseList = [lockedVolumesForRestore[0]].map(({ lockedVolumeId, decryptedPassphrase }) =>
            restoreVolume(
                defaultShare.volumeId,
                privateKey,
                hashKey,
                addressKey,
                address,
                lockedVolumeId,
                decryptedPassphrase
            )
        );
        return preventLeave(Promise.all(restorePromiseList));
    };

    const deleteLockedVolumes = async () => {
        const lockedShares = getLockedShares();

        const lockedVolumeIds = lockedShares.map(({ volumeId }) => volumeId);
        await preventLeave(
            Promise.all(lockedVolumeIds.map((volumeId) => debouncedRequest(queryDeleteLockedVolumes(volumeId))))
        );

        const lockedShareIds = lockedShares.map(({ shareId }) => shareId);
        removeShares(lockedShareIds);
    };

    return {
        lockedVolumesCount: getLockedShares().length,
        hasLockedVolumes: !!getLockedShares().length,
        hasVolumesForRestore: !!lockedVolumesForRestore?.length,
        prepareVolumesForRestore,
        getVolumesForRestore,
        restoreVolumes,
        deleteLockedVolumes,
    };
}

async function prepareVolumeForRestore(
    share: ShareWithKey,
    addressPrivateKeys: OpenPGPKey[]
): Promise<LockedVolumeForRestore | undefined> {
    try {
        const signature = await getSignature(share.passphraseSignature);
        const matchingPrivateKey = await getMatchingKey(signature, addressPrivateKeys);

        if (matchingPrivateKey) {
            const decryptedPassphrase = await decryptLockedSharePassphrase(matchingPrivateKey, share);
            if (decryptedPassphrase) {
                return { lockedVolumeId: share.volumeId, decryptedPassphrase };
            }
        }
    } catch {
        return undefined;
    }
}

async function decryptLockedSharePassphrase(
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
