import { useCallback, useEffect, useState } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { usePreventLeave } from '@proton/components';
import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import {
    queryDeleteLockedVolumes,
    queryGetDriveVolume,
    queryRestoreDriveVolume,
} from '@proton/shared/lib/api/drive/volume';
import { getEncryptedSessionKey } from '@proton/shared/lib/calendar/crypto/encrypt';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { type GetDriveVolumeResult, VolumeType } from '@proton/shared/lib/interfaces/drive/volume';
import { encryptPassphrase, generateLookupHash, sign } from '@proton/shared/lib/keys/driveKeys';

import { useCreatePhotosWithAlbums } from '../../../photos/PhotosStore/useCreatePhotosWithAlbums';
import { useSharesStore } from '../../../zustand/share/shares.store';
import { useDebouncedRequest } from '../../_api';
import { useDriveCrypto } from '../../_crypto';
import { useLink } from '../../_links';
import { GLOBAL_FORBIDDEN_CHARACTERS } from '../../_links/link';
import { useDebouncedFunction } from '../../_utils';
import {
    type LockedDeviceForRestore,
    type LockedPhotosForRestore,
    type LockedShareForRestore,
    type LockedVolumeForRestore,
    type ShareWithKey,
} from './../interface';
import useDefaultShare from './../useDefaultShare';
import useShare from './../useShare';
import { getPossibleAddressPrivateKeys, prepareVolumeForRestore } from './utils';

type LockedSharesPerVolume = Map<
    string,
    {
        defaultShares: ShareWithKey[];
        devices: ShareWithKey[];
        photos: ShareWithKey[];
    }
>;

export type AddressesKeysResult = { address: Address; keys: DecryptedAddressKey[] }[] | undefined;
/**
 * useLockedVolume provides actions to delete or recover files from locked volumes.
 */
export default function useLockedVolume() {
    const { getLinkPrivateKey, getLinkHashKey } = useLink();
    const [addressesKeys, setAddressesKeys] = useState<AddressesKeysResult>(undefined);
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    const { createPhotosWithAlbumsShare } = useCreatePhotosWithAlbums();

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
        getShareWithKey: useShare().getShareWithKey,
        getDefaultShare: useDefaultShare().getDefaultShare,
        getDefaultPhotosShare: useDefaultShare().getDefaultPhotosShare,
        addressesKeys,
        getOwnAddressAndPrimaryKeys: useDriveCrypto().getOwnAddressAndPrimaryKeys,
        prepareVolumeForRestore,
        getLinkHashKey,
        getLinkPrivateKey,
        createPhotosWithAlbumsShare,
    });
}

type LockedVolumesCallbacks = {
    getShareWithKey: ReturnType<typeof useShare>['getShareWithKey'];
    addressesKeys: AddressesKeysResult;
    getDefaultShare: ReturnType<typeof useDefaultShare>['getDefaultShare'];
    getDefaultPhotosShare: ReturnType<typeof useDefaultShare>['getDefaultPhotosShare'];
    getOwnAddressAndPrimaryKeys: ReturnType<typeof useDriveCrypto>['getOwnAddressAndPrimaryKeys'];
    prepareVolumeForRestore: typeof prepareVolumeForRestore;
    getLinkPrivateKey: ReturnType<typeof useLink>['getLinkPrivateKey'];
    getLinkHashKey: ReturnType<typeof useLink>['getLinkHashKey'];
    createPhotosWithAlbumsShare: ReturnType<typeof useCreatePhotosWithAlbums>['createPhotosWithAlbumsShare'];
};

export function useLockedVolumeInner({
    getShareWithKey,
    addressesKeys,
    getDefaultShare,
    getDefaultPhotosShare,
    getOwnAddressAndPrimaryKeys,
    prepareVolumeForRestore,
    getLinkPrivateKey,
    getLinkHashKey,
    createPhotosWithAlbumsShare,
}: LockedVolumesCallbacks) {
    const { preventLeave } = usePreventLeave();
    const debouncedFunction = useDebouncedFunction();
    const debouncedRequest = useDebouncedRequest();

    const { getLockedSharesByVolume, lockedVolumesForRestore, setLockedVolumesForRestore, removeShares } =
        useSharesStore(
            useShallow((state) => ({
                getLockedSharesByVolume: state.getLockedSharesByVolume,
                lockedVolumesForRestore: state.lockedVolumesForRestore,
                setLockedVolumesForRestore: state.setLockedVolumesForRestore,
                removeShares: state.removeShares,
            }))
        );

    const getLoadedLockedShares = useCallback(
        async (abortSignal: AbortSignal): Promise<LockedSharesPerVolume> => {
            const loadedLockedShares = new Map();
            const currentLockedSharesByVolume = getLockedSharesByVolume();
            for (const [volumeId, lockedShares] of currentLockedSharesByVolume) {
                loadedLockedShares.set(volumeId, {
                    defaultShares: await Promise.all(
                        lockedShares.defaultShares.map((defaultShare) =>
                            getShareWithKey(abortSignal, defaultShare.shareId)
                        )
                    ),
                    devices: await Promise.all(
                        lockedShares.devices.map((defaultShare) => getShareWithKey(abortSignal, defaultShare.shareId))
                    ),

                    photos: await Promise.all(
                        lockedShares.photos.map((defaultShare) => getShareWithKey(abortSignal, defaultShare.shareId))
                    ),
                });
            }
            return loadedLockedShares;
        },
        [getLockedSharesByVolume]
    );

    const getLockedUnpreparedShares = useCallback(async (lockedShares: LockedSharesPerVolume) => {
        const currentLockedVolumesForRestore = useSharesStore.getState().lockedVolumesForRestore;
        const lockedUnpreparedShares = new Map();

        const existingDefaultShareIds = new Set(
            currentLockedVolumesForRestore.flatMap(({ defaultShares }) => defaultShares.map((share) => share.shareId))
        );
        const existingDeviceShareIds = new Set(
            currentLockedVolumesForRestore.flatMap(({ devices }) => devices.map((share) => share.shareId))
        );
        const existingPhotoShareIds = new Set(
            currentLockedVolumesForRestore.flatMap(({ photos }) => photos.map((share) => share.shareId))
        );

        for (const [volumeId, { defaultShares, devices, photos }] of lockedShares) {
            const unpreparedDefaultShares = defaultShares.filter(
                ({ shareId }) => !existingDefaultShareIds.has(shareId)
            );
            const unpreparedDevices = devices.filter(({ shareId }) => !existingDeviceShareIds.has(shareId));
            const unpreparedPhotos = photos.filter(({ shareId }) => !existingPhotoShareIds.has(shareId));

            if (unpreparedDefaultShares.length || unpreparedDevices.length || unpreparedPhotos.length) {
                lockedUnpreparedShares.set(volumeId, {
                    defaultShares: unpreparedDefaultShares,
                    devices: unpreparedDevices,
                    photos: unpreparedPhotos,
                });
            }
        }

        return lockedUnpreparedShares;
    }, []);

    const getPreparedVolumes = useCallback(
        async (lockedUnpreparedShares: LockedSharesPerVolume, addressPrivateKeys: PrivateKeyReference[]) => {
            const preparedVolumes = [];
            for (const [volumeId, { defaultShares, devices, photos }] of lockedUnpreparedShares) {
                const cacheKey = defaultShares
                    .concat(devices)
                    .concat(photos)
                    .map((share) => share.shareId)
                    .join(',');
                const preparedVolume = await debouncedFunction(
                    async () => prepareVolumeForRestore(volumeId, defaultShares, devices, photos, addressPrivateKeys),
                    ['prepareVolumeForRestore', cacheKey]
                );
                if (
                    preparedVolume?.defaultShares.length ||
                    preparedVolume?.devices.length ||
                    preparedVolume?.photos.length
                ) {
                    preparedVolumes.push(preparedVolume);
                }
            }
            return preparedVolumes;
        },
        [prepareVolumeForRestore]
    );

    const prepareVolumesForRestore = useCallback(
        async (abortSignal: AbortSignal): Promise<LockedVolumeForRestore[]> => {
            const currentLockedVolumesForRestore = useSharesStore.getState().lockedVolumesForRestore;
            const addressPrivateKeys = getPossibleAddressPrivateKeys(addressesKeys);
            if (!addressPrivateKeys?.length) {
                return currentLockedVolumesForRestore;
            }

            const lockedShares = await getLoadedLockedShares(abortSignal);
            const lockedUnpreparedShares = await getLockedUnpreparedShares(lockedShares);
            if (!lockedUnpreparedShares.size) {
                return currentLockedVolumesForRestore;
            }

            const newPreparedVolumes = await getPreparedVolumes(lockedUnpreparedShares, addressPrivateKeys);
            if (!newPreparedVolumes.length) {
                return currentLockedVolumesForRestore;
            }

            const volumes = [...currentLockedVolumesForRestore, ...newPreparedVolumes];

            setLockedVolumesForRestore(volumes);
            return volumes;
        },
        [
            addressesKeys,
            getLockedUnpreparedShares,
            getPreparedVolumes,
            getLoadedLockedShares,
            setLockedVolumesForRestore,
        ]
    );

    const restoreVolume = async (
        privateKey: PrivateKeyReference,
        hashKey: Uint8Array<ArrayBuffer>,
        addressKey: PrivateKeyReference,
        address: Address,
        lockedVolumeId: string,
        lockedDefaultShares: LockedShareForRestore[],
        lockedDevices: LockedDeviceForRestore[],
        lockedPhotos: LockedPhotosForRestore[],
        addressKeyID: string
    ) => {
        if (!hashKey) {
            throw new Error('Missing hash key on folder link');
        }

        const [defaultSharesPayloads, devicePassphrases, photosPassphrases] = await Promise.all([
            Promise.all(
                lockedDefaultShares.map(async (lockedShare, index) => {
                    const formattedDate = format(new Date(), 'Ppp', { locale: dateLocale }).replaceAll(
                        RegExp(GLOBAL_FORBIDDEN_CHARACTERS, 'g'),
                        ' '
                    );
                    // translator: The date is in locale of user's preference. It's used for folder name and translating the beginning of the string is enough.
                    let restoreFolderName = c('Info').t`Restored files ${formattedDate}`;
                    if (index > 0) {
                        restoreFolderName = `${restoreFolderName} (${index + 1})`;
                    }

                    const [Hash, { NodePassphrase, NodePassphraseSignature }, { message: encryptedName }] =
                        await Promise.all([
                            generateLookupHash(restoreFolderName, hashKey),
                            encryptPassphrase(privateKey, addressKey, lockedShare.linkDecryptedPassphrase),
                            CryptoProxy.encryptMessage({
                                textData: restoreFolderName,
                                stripTrailingSpaces: true,
                                encryptionKeys: privateKey,
                                signingKeys: addressKey,
                            }),
                        ]);

                    return {
                        LockedShareID: lockedShare.shareId,
                        Name: encryptedName,
                        Hash,
                        NodePassphrase,
                        NodePassphraseSignature,
                    };
                })
            ),

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
                SignatureAddress: address.Email,
                MainShares: defaultSharesPayloads,
                Devices: devicesPayload,
                PhotoShares: photosPayload,
                AddressKeyID: addressKeyID,
            })
        );
    };

    const restoreVolumes = async (abortSignal: AbortSignal) => {
        const preparedVolumesForRestore = await prepareVolumesForRestore(abortSignal);
        if (preparedVolumesForRestore.length === 0) {
            return false;
        }

        for (const preparedVolume of preparedVolumesForRestore) {
            // TODO: Not optimal as it's double the call that what we have in useDefaultShare.getDefaultPhotosShare,
            // but it prevent changing too many things
            const { Volume } = await debouncedRequest<GetDriveVolumeResult>(
                queryGetDriveVolume(preparedVolume.lockedVolumeId)
            );
            const isPhotosVolume = Volume.Type === VolumeType.Photos;
            let defaultShare:
                | undefined
                | {
                      volumeId: string;
                      shareId: string;
                      rootLinkId: string;
                      addressId: string;
                  };
            defaultShare = isPhotosVolume
                ? await getDefaultPhotosShare(abortSignal, true)
                : await getDefaultShare(abortSignal);

            if (!defaultShare) {
                if (!isPhotosVolume) {
                    return false;
                } else {
                    // Photo share is optional and if used doesn't have any yet, we create one.
                    // If we don't, there is no place where to recover old photos.
                    const defaultPhotoShare = await createPhotosWithAlbumsShare();
                    defaultShare = {
                        volumeId: defaultPhotoShare.volumeId,
                        shareId: defaultPhotoShare.shareId,
                        rootLinkId: defaultPhotoShare.linkId,
                        addressId: defaultPhotoShare.addressId,
                    };
                }
            }

            const {
                privateKey: addressKey,
                address,
                addressKeyID,
            } = await getOwnAddressAndPrimaryKeys(defaultShare.addressId);

            const [privateKey, hashKey] = await Promise.all([
                getLinkPrivateKey(abortSignal, defaultShare.shareId, defaultShare.rootLinkId),
                getLinkHashKey(abortSignal, defaultShare.shareId, defaultShare.rootLinkId),
            ]);

            await restoreVolume(
                privateKey,
                hashKey,
                addressKey,
                address,
                preparedVolume.lockedVolumeId,
                preparedVolume.defaultShares,
                preparedVolume.devices,
                preparedVolume.photos,
                addressKeyID
            );

            // This is fine to not inclued lockedVolume.photos as only lockedVolume.defaultShares is used to check if restore is needed
            // This prevent locked albums to be removed and then we can't detect if we can show migration page or not
            removeShares([
                ...preparedVolume.defaultShares.map(({ shareId }) => shareId),
                ...preparedVolume.devices.map(({ shareId }) => shareId),
                ...preparedVolume.photos.map(({ shareId }) => shareId),
            ]);
        }

        setLockedVolumesForRestore([]);

        return true;
    };

    const deleteLockedVolumes = async () => {
        const lockedShares = getLockedSharesByVolume();

        const lockedShareIds: string[] = [];

        for (const { defaultShares, devices, photos } of lockedShares.values()) {
            lockedShareIds.push(...defaultShares.map((share) => share.shareId));
            lockedShareIds.push(...devices.map((device) => device.shareId));
            lockedShareIds.push(...photos.map((photo) => photo.shareId));
        }

        await preventLeave(
            Promise.all(
                Array.from(lockedShares.keys()).map((volumeId) => debouncedRequest(queryDeleteLockedVolumes(volumeId)))
            )
        );

        removeShares(lockedShareIds);
    };

    const lockedVolumesCount = getLockedSharesByVolume().size;

    return {
        isReadyForPreparation: !!lockedVolumesCount && !!addressesKeys?.length,
        lockedVolumesCount: lockedVolumesCount,
        hasLockedVolumes: !!lockedVolumesCount,
        hasVolumesForRestore: !!lockedVolumesForRestore.length,
        deleteLockedVolumes,
        prepareVolumesForRestore,
        restoreVolumes,
    };
}
