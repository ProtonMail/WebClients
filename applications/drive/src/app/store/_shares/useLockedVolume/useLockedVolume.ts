import { useCallback, useEffect, useState } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';

import { useGetAddressKeys, useGetAddresses, usePreventLeave } from '@proton/components';
import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { queryDeleteLockedVolumes, queryRestoreDriveVolume } from '@proton/shared/lib/api/drive/volume';
import { getEncryptedSessionKey } from '@proton/shared/lib/calendar/crypto/encrypt';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { dateLocale } from '@proton/shared/lib/i18n';
import { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { encryptPassphrase, generateLookupHash, sign } from '@proton/shared/lib/keys/driveKeys';
import isTruthy from '@proton/utils/isTruthy';

import { useDebouncedRequest } from '../../_api';
import { useDriveCrypto } from '../../_crypto';
import { useLink } from '../../_links';
import { GLOBAL_FORBIDDEN_CHARACTERS } from '../../_links/link';
import { useDebouncedFunction } from '../../_utils';
import { LockedDeviceForRestore, LockedPhotosForRestore, LockedVolumeForRestore, ShareWithKey } from './../interface';
import useDefaultShare from './../useDefaultShare';
import useShare from './../useShare';
import useSharesState from './../useSharesState';
import { getPossibleAddressPrivateKeys, prepareVolumeForRestore } from './utils';

type LockedShares = {
    defaultShare: ShareWithKey;
    devices: ShareWithKey[];
    photos: ShareWithKey[];
}[];

export type AddressesKeysResult = { address: Address; keys: DecryptedAddressKey[] }[] | undefined;
/**
 * useLockedVolume provides actions to delete or recover files from locked volumes.
 */
export default function useLockedVolume() {
    const { getLinkPrivateKey, getLinkHashKey } = useLink();
    const [addressesKeys, setAddressesKeys] = useState<AddressesKeysResult>(undefined);
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();

    // Fetch and store the keys associated with each address
    // It first fetches all addresses, and then fetch all keys for each address.
    // We wait for all the keys to be loaded before setting them into the state.
    // This prevent unexpected issue during recovery when an user have multiple addresses and all keys are not yet loaded.
    useEffect(() => {
        void getAddresses().then((addresses) => {
            void Promise.all(
                addresses.map(async (address) => {
                    const addressKeys = await getAddressKeys(address.ID);
                    return {
                        address,
                        keys: addressKeys,
                    };
                })
            ).then(setAddressesKeys);
        });
    }, [getAddressKeys, getAddresses]);

    return useLockedVolumeInner({
        sharesState: useSharesState(),
        getShareWithKey: useShare().getShareWithKey,
        getDefaultShare: useDefaultShare().getDefaultShare,
        addressesKeys,
        getOwnAddressAndPrimaryKeys: useDriveCrypto().getOwnAddressAndPrimaryKeys,
        prepareVolumeForRestore,
        getLinkHashKey,
        getLinkPrivateKey,
    });
}

type LockedVolumesCallbacks = {
    sharesState: ReturnType<typeof useSharesState>;
    getShareWithKey: ReturnType<typeof useShare>['getShareWithKey'];
    addressesKeys: AddressesKeysResult;
    getDefaultShare: ReturnType<typeof useDefaultShare>['getDefaultShare'];
    getOwnAddressAndPrimaryKeys: ReturnType<typeof useDriveCrypto>['getOwnAddressAndPrimaryKeys'];
    prepareVolumeForRestore: typeof prepareVolumeForRestore;
    getLinkPrivateKey: ReturnType<typeof useLink>['getLinkPrivateKey'];
    getLinkHashKey: ReturnType<typeof useLink>['getLinkHashKey'];
};

export function useLockedVolumeInner({
    getShareWithKey,
    sharesState,
    addressesKeys,
    getDefaultShare,
    getOwnAddressAndPrimaryKeys,
    prepareVolumeForRestore,
    getLinkPrivateKey,
    getLinkHashKey,
}: LockedVolumesCallbacks) {
    const { preventLeave } = usePreventLeave();
    const debouncedFunction = useDebouncedFunction();
    const debouncedRequest = useDebouncedRequest();

    const getLoadedLockedShares = useCallback(
        async (abortSignal: AbortSignal): Promise<LockedShares> => {
            return Promise.all(
                sharesState.getLockedShares().map(async ({ defaultShare, devices, photos }) => {
                    return {
                        defaultShare: await getShareWithKey(abortSignal, defaultShare.shareId),
                        devices: await Promise.all(
                            devices.map((device) => getShareWithKey(abortSignal, device.shareId))
                        ),
                        photos: await Promise.all(photos.map((photo) => getShareWithKey(abortSignal, photo.shareId))),
                    };
                })
            );
        },
        [sharesState.getLockedShares]
    );
    const getLockedUnpreparedShares = useCallback(
        async (lockedShares: LockedShares) => {
            return lockedShares.filter(
                ({ defaultShare: { volumeId } }) =>
                    !sharesState.lockedVolumesForRestore.some(({ lockedVolumeId }) => volumeId === lockedVolumeId)
            );
        },
        [sharesState.lockedVolumesForRestore]
    );

    const getPreparedVolumes = useCallback(
        async (lockedUnpreparedShares: LockedShares, addressPrivateKeys: PrivateKeyReference[]) => {
            const preparedVolumes = await Promise.all(
                lockedUnpreparedShares.map(({ defaultShare, devices, photos }) => {
                    return debouncedFunction(
                        async () => prepareVolumeForRestore(defaultShare, devices, photos, addressPrivateKeys),
                        ['prepareVolumeForRestore', defaultShare.volumeId]
                    );
                })
            );

            return preparedVolumes.filter(isTruthy);
        },
        []
    );

    const prepareVolumesForRestore = useCallback(
        async (abortSignal: AbortSignal): Promise<LockedVolumeForRestore[]> => {
            const { lockedVolumesForRestore } = sharesState;
            const addressPrivateKeys = getPossibleAddressPrivateKeys(addressesKeys);
            if (!addressPrivateKeys?.length) {
                return lockedVolumesForRestore;
            }

            const lockedUnpreparedShares = await getLockedUnpreparedShares(await getLoadedLockedShares(abortSignal));
            if (!lockedUnpreparedShares.length) {
                return lockedVolumesForRestore;
            }

            const newPreparedVolumes = await getPreparedVolumes(lockedUnpreparedShares, addressPrivateKeys);
            if (!newPreparedVolumes.length) {
                return lockedVolumesForRestore;
            }

            const volumes = [...lockedVolumesForRestore, ...newPreparedVolumes];
            sharesState.setLockedVolumesForRestore(volumes);
            return volumes;
        },
        [
            addressesKeys,
            getLockedUnpreparedShares,
            getPreparedVolumes,
            getLoadedLockedShares,
            sharesState.setLockedVolumesForRestore,
            sharesState.lockedVolumesForRestore,
        ]
    );

    const restoreVolume = async (
        parentVolumeID: string,
        privateKey: PrivateKeyReference,
        hashKey: Uint8Array,
        addressKey: PrivateKeyReference,
        address: Address,
        lockedVolumeId: string,
        lockedShareLinkPassphraseRaw: string,
        lockedDevices: LockedDeviceForRestore[],
        lockedPhotos: LockedPhotosForRestore[]
    ) => {
        if (!hashKey) {
            throw new Error('Missing hash key on folder link');
        }

        const formattedDate = format(new Date(), 'Ppp', { locale: dateLocale }).replaceAll(
            RegExp(GLOBAL_FORBIDDEN_CHARACTERS, 'g'),
            ' '
        );
        // translator: The date is in locale of user's preference. It's used for folder name and translating the beginning of the string is enough.
        const restoreFolderName = c('Info').t`Restored files ${formattedDate}`;

        const [
            Hash,
            { NodePassphrase, NodePassphraseSignature },
            { message: encryptedName },
            devicePassphrases,
            photosPassphrases,
        ] = await Promise.all([
            generateLookupHash(restoreFolderName, hashKey),
            encryptPassphrase(privateKey, addressKey, lockedShareLinkPassphraseRaw),
            CryptoProxy.encryptMessage({
                textData: restoreFolderName,
                stripTrailingSpaces: true,
                encryptionKeys: privateKey,
                signingKeys: addressKey,
            }),
            Promise.all(
                lockedDevices.map(async (device) => {
                    const [sharePassphraseSignature, shareKeyPacket] = await Promise.all([
                        sign(device.shareDecryptedPassphrase, addressKey),
                        getEncryptedSessionKey(device.shareSessionKey, addressKey).then(uint8ArrayToBase64String),
                    ]);
                    return {
                        sharePassphraseSignature,
                        shareKeyPacket,
                    };
                })
            ),
            Promise.all(
                lockedPhotos.map(async (photo) => {
                    const [sharePassphraseSignature, shareKeyPacket] = await Promise.all([
                        sign(photo.shareDecryptedPassphrase, addressKey),
                        getEncryptedSessionKey(photo.shareSessionKey, addressKey).then(uint8ArrayToBase64String),
                    ]);
                    return {
                        sharePassphraseSignature,
                        shareKeyPacket,
                    };
                })
            ),
        ]);

        const devicesPayload = lockedDevices.map(({ shareId }, idx) => {
            const { shareKeyPacket, sharePassphraseSignature } = devicePassphrases[idx];
            return {
                LockedShareID: shareId,
                ShareKeyPacket: shareKeyPacket,
                PassphraseSignature: sharePassphraseSignature,
            };
        });
        const photosPayload = lockedPhotos.map(({ shareId }, idx) => {
            const { shareKeyPacket, sharePassphraseSignature } = photosPassphrases[idx];
            return {
                LockedShareID: shareId,
                ShareKeyPacket: shareKeyPacket,
                PassphraseSignature: sharePassphraseSignature,
            };
        });

        await debouncedRequest(
            queryRestoreDriveVolume(lockedVolumeId, {
                Name: encryptedName,
                SignatureAddress: address.Email,
                Hash,
                NodePassphrase,
                NodePassphraseSignature,
                TargetVolumeID: parentVolumeID,
                Devices: devicesPayload,
                PhotoShares: photosPayload,
            })
        );
    };

    const restoreVolumes = async (abortSignal: AbortSignal) => {
        const defaultShare = await getDefaultShare(abortSignal);
        const lockedVolumesForRestore = await prepareVolumesForRestore(abortSignal);
        if (!defaultShare || !lockedVolumesForRestore.length) {
            return;
        }

        const [privateKey, hashKey, { privateKey: addressKey, address }] = await Promise.all([
            getLinkPrivateKey(abortSignal, defaultShare.shareId, defaultShare.rootLinkId),
            getLinkHashKey(abortSignal, defaultShare.shareId, defaultShare.rootLinkId),
            getOwnAddressAndPrimaryKeys(defaultShare.creator),
        ]);

        // Backend does not support restoring of multiple volumes at one time.
        // Resotring is async operation and user has to trigger it for the next
        // volume manualy later again.
        const restorePromiseList = [lockedVolumesForRestore[0]].map(async (lockedVolume) => {
            await restoreVolume(
                defaultShare.volumeId,
                privateKey,
                hashKey,
                addressKey,
                address,
                lockedVolume.lockedVolumeId,
                lockedVolume.defaultShare.linkDecryptedPassphrase,
                lockedVolume.devices,
                lockedVolume.photos
            );
            sharesState.removeShares([
                lockedVolume.defaultShare.shareId,
                ...lockedVolume.devices.map(({ shareId }) => shareId),
                ...lockedVolume.photos.map(({ shareId }) => shareId),
            ]);
        });
        await preventLeave(Promise.all(restorePromiseList));

        sharesState.setLockedVolumesForRestore([]);
    };

    const deleteLockedVolumes = async () => {
        const lockedShares = sharesState.getLockedShares();

        const lockedVolumeIds = lockedShares.map(({ defaultShare: { volumeId } }) => volumeId);
        await preventLeave(
            Promise.all(lockedVolumeIds.map((volumeId) => debouncedRequest(queryDeleteLockedVolumes(volumeId))))
        );

        const lockedShareIds = lockedShares.map(({ defaultShare: { shareId } }) => shareId);
        sharesState.removeShares(lockedShareIds);
    };

    const lockedSharesCount = sharesState.getLockedShares().length;

    return {
        isReadyForPreparation: !!lockedSharesCount && !!addressesKeys?.length,
        lockedVolumesCount: lockedSharesCount,
        hasLockedVolumes: lockedSharesCount,
        hasVolumesForRestore: !!sharesState.lockedVolumesForRestore?.length,
        deleteLockedVolumes,
        prepareVolumesForRestore,
        restoreVolumes,
    };
}
