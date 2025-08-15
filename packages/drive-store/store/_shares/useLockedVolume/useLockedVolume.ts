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
import isTruthy from '@proton/utils/isTruthy';

import { useCreatePhotosWithAlbums } from '../../../photos/PhotosStore/useCreatePhotosWithAlbums';
import { useSharesStore } from '../../../zustand/share/shares.store';
import { useDebouncedRequest } from '../../_api';
import { useDriveCrypto } from '../../_crypto';
import { useLink } from '../../_links';
import { GLOBAL_FORBIDDEN_CHARACTERS } from '../../_links/link';
import { useDebouncedFunction } from '../../_utils';
import type {
    LockedDeviceForRestore,
    LockedPhotosForRestore,
    LockedShareForRestore,
    LockedVolumeForRestore,
    ShareWithKey,
} from './../interface';
import useDefaultShare from './../useDefaultShare';
import useShare from './../useShare';
import { getPossibleAddressPrivateKeys, prepareVolumeForRestore } from './utils';

type LockedShares = {
    defaultShares: ShareWithKey[];
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
    const { getLockedShares, lockedVolumesForRestore, setLockedVolumesForRestore, removeShares } = useSharesStore(
        useShallow((state) => ({
            getLockedShares: state.getLockedShares,
            lockedVolumesForRestore: state.lockedVolumesForRestore,
            setLockedVolumesForRestore: state.setLockedVolumesForRestore,
            removeShares: state.removeShares,
        }))
    );

    const getLoadedLockedShares = useCallback(
        async (abortSignal: AbortSignal): Promise<LockedShares> => {
            return Promise.all(
                getLockedShares().map(async ({ defaultShares, devices, photos }) => {
                    return {
                        defaultShares: await Promise.all(
                            defaultShares.map((defaultShare) => getShareWithKey(abortSignal, defaultShare.shareId))
                        ),
                        devices: await Promise.all(
                            devices.map((device) => getShareWithKey(abortSignal, device.shareId))
                        ),
                        photos: await Promise.all(photos.map((photo) => getShareWithKey(abortSignal, photo.shareId))),
                    };
                })
            );
        },
        [getLockedShares]
    );

    const getLockedUnpreparedShares = useCallback(
        async (lockedShares: LockedShares) => {
            return lockedShares.filter(
                ({ defaultShares }) =>
                    !defaultShares.some(({ volumeId }) =>
                        lockedVolumesForRestore.some(({ lockedVolumeId }) => volumeId === lockedVolumeId)
                    )
            );
        },
        [lockedVolumesForRestore]
    );

    const getPreparedVolumes = useCallback(
        async (lockedUnpreparedShares: LockedShares, addressPrivateKeys: PrivateKeyReference[]) => {
            const preparedVolumes = await Promise.all(
                lockedUnpreparedShares.map(({ defaultShares, devices, photos }) => {
                    return debouncedFunction(
                        async () => prepareVolumeForRestore(defaultShares, devices, photos, addressPrivateKeys),
                        ['prepareVolumeForRestore', defaultShares.map((share) => share.volumeId).join(',')]
                    );
                })
            );

            return preparedVolumes.filter(isTruthy);
        },
        []
    );

    const prepareVolumesForRestore = useCallback(
        async (abortSignal: AbortSignal): Promise<LockedVolumeForRestore[]> => {
            const addressPrivateKeys = getPossibleAddressPrivateKeys(addressesKeys);
            if (!addressPrivateKeys?.length) {
                return lockedVolumesForRestore;
            }

            const lockedShares = await getLoadedLockedShares(abortSignal);
            const lockedUnpreparedShares = await getLockedUnpreparedShares(lockedShares);
            if (!lockedUnpreparedShares.length) {
                return lockedVolumesForRestore;
            }

            const newPreparedVolumes = await getPreparedVolumes(lockedUnpreparedShares, addressPrivateKeys);
            if (!newPreparedVolumes.length) {
                return lockedVolumesForRestore;
            }

            const volumes = [...lockedVolumesForRestore, ...newPreparedVolumes];

            setLockedVolumesForRestore(volumes);

            return volumes;
        },
        [
            addressesKeys,
            getLockedUnpreparedShares,
            getPreparedVolumes,
            getLoadedLockedShares,
            setLockedVolumesForRestore,
            lockedVolumesForRestore,
        ]
    );

    const restorePhotosVolume = async (
        parentVolumeID: string,
        addressKey: PrivateKeyReference,
        address: Address,
        lockedVolumeId: string,
        lockedPhotos: LockedPhotosForRestore[],
        addressKeyID: string
    ) => {
        const photosPassphrases = await Promise.all(
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
        );
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
                AddressKeyID: addressKeyID,
                PhotoShares: photosPayload,
            })
        );
    };

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
        const lockedVolumesForRestore = await prepareVolumesForRestore(abortSignal);
        if (lockedVolumesForRestore.length === 0) {
            return false;
        }

        for (let lockedVolume of lockedVolumesForRestore) {
            // TODO: Not optimal as it's double the call that what we have in useDefaultShare.getDefaultPhotosShare,
            // but it prevent changing too many things
            const { Volume } = await debouncedRequest<GetDriveVolumeResult>(
                queryGetDriveVolume(lockedVolume.lockedVolumeId)
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

            if (isPhotosVolume) {
                await restorePhotosVolume(
                    defaultShare.volumeId,
                    addressKey,
                    address,
                    lockedVolume.lockedVolumeId,
                    lockedVolume.photos,
                    addressKeyID
                );
            } else {
                const [privateKey, hashKey] = await Promise.all([
                    getLinkPrivateKey(abortSignal, defaultShare.shareId, defaultShare.rootLinkId),
                    getLinkHashKey(abortSignal, defaultShare.shareId, defaultShare.rootLinkId),
                ]);

                await restoreVolume(
                    privateKey,
                    hashKey,
                    addressKey,
                    address,
                    lockedVolume.lockedVolumeId,
                    lockedVolume.defaultShares,
                    lockedVolume.devices,
                    lockedVolume.photos,
                    addressKeyID
                );
            }

            // This is fine to not inclued lockedVolume.photos as only lockedVolume.defaultShares is used to check if restore is needed
            // This prevent locked albums to be removed and then we can't detect if we can show migration page or not
            removeShares([
                ...lockedVolume.defaultShares.map(({ shareId }) => shareId),
                ...lockedVolume.devices.map(({ shareId }) => shareId),
            ]);
        }

        setLockedVolumesForRestore([]);

        return true;
    };

    const deleteLockedVolumes = async () => {
        const lockedShares = getLockedShares();

        const lockedVolumeIds = lockedShares.flatMap(({ defaultShares }) =>
            defaultShares.map(({ volumeId }) => volumeId)
        );
        await preventLeave(
            Promise.all(lockedVolumeIds.map((volumeId) => debouncedRequest(queryDeleteLockedVolumes(volumeId))))
        );

        const lockedShareIds = lockedShares.flatMap(({ defaultShares }) => defaultShares.map(({ shareId }) => shareId));
        removeShares(lockedShareIds);
    };

    const lockedSharesCount = getLockedShares().length;

    return {
        isReadyForPreparation: !!lockedSharesCount && !!addressesKeys?.length,
        lockedVolumesCount: lockedSharesCount,
        hasLockedVolumes: lockedSharesCount,
        hasVolumesForRestore: !!lockedVolumesForRestore?.length,
        deleteLockedVolumes,
        prepareVolumesForRestore,
        restoreVolumes,
    };
}
