import { useCallback, useEffect, useState } from 'react';

import { format } from 'date-fns';
import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { usePreventLeave } from '@proton/components';
import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { queryDeleteLockedVolumes, queryRestoreDriveVolume } from '@proton/shared/lib/api/drive/volume';
import { getEncryptedSessionKey } from '@proton/shared/lib/calendar/crypto/encrypt';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { Address, DecryptedAddressKey } from '@proton/shared/lib/interfaces';
import { encryptPassphrase, generateLookupHash, sign } from '@proton/shared/lib/keys/driveKeys';
import isTruthy from '@proton/utils/isTruthy';

import { useSharesStore } from '../../../zustand/share/shares.store';
import { useDebouncedRequest } from '../../_api';
import { useDriveCrypto } from '../../_crypto';
import { useLink } from '../../_links';
import { GLOBAL_FORBIDDEN_CHARACTERS } from '../../_links/link';
import { useDebouncedFunction } from '../../_utils';
import type {
    LockedDeviceForRestore,
    LockedPhotosForRestore,
    LockedVolumeForRestore,
    ShareWithKey,
} from './../interface';
import useDefaultShare from './../useDefaultShare';
import useShare from './../useShare';
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
                getLockedShares().map(async ({ defaultShare, devices, photos }) => {
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
        [getLockedShares]
    );

    const getLockedUnpreparedShares = useCallback(
        async (lockedShares: LockedShares) => {
            return lockedShares.filter(
                ({ defaultShare: { volumeId } }) =>
                    !lockedVolumesForRestore.some(({ lockedVolumeId }) => volumeId === lockedVolumeId)
            );
        },
        [lockedVolumesForRestore]
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
        async (
            abortSignal: AbortSignal,
            autoRestore?: {
                preloadedLockedShares: LockedShares;
                preloadedAddressesKeys: AddressesKeysResult;
            }
        ): Promise<LockedVolumeForRestore[]> => {
            const addressPrivateKeys = getPossibleAddressPrivateKeys(
                autoRestore?.preloadedAddressesKeys || addressesKeys
            );
            if (!addressPrivateKeys?.length) {
                return lockedVolumesForRestore;
            }

            const lockedShares = autoRestore?.preloadedLockedShares || (await getLoadedLockedShares(abortSignal));
            const lockedUnpreparedShares = await getLockedUnpreparedShares(lockedShares);
            if (!lockedUnpreparedShares.length) {
                return lockedVolumesForRestore;
            }

            const newPreparedVolumes = await getPreparedVolumes(lockedUnpreparedShares, addressPrivateKeys);
            if (!newPreparedVolumes.length) {
                return lockedVolumesForRestore;
            }

            const volumes = [...lockedVolumesForRestore, ...newPreparedVolumes];
            // We don't want to show those locked volumes in UI if they are for auto-restore
            if (!autoRestore) {
                setLockedVolumesForRestore(volumes);
            }
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

    const restoreVolume = async (
        parentVolumeID: string,
        privateKey: PrivateKeyReference,
        hashKey: Uint8Array,
        addressKey: PrivateKeyReference,
        address: Address,
        lockedVolumeId: string,
        lockedShareLinkPassphraseRaw: string,
        lockedDevices: LockedDeviceForRestore[],
        lockedPhotos: LockedPhotosForRestore[],
        addressKeyID: string,
        // For auto-restore
        forASV: boolean = false
    ) => {
        if (!hashKey) {
            throw new Error('Missing hash key on folder link');
        }

        const formattedDate = format(new Date(), 'Ppp', { locale: dateLocale }).replaceAll(
            RegExp(GLOBAL_FORBIDDEN_CHARACTERS, 'g'),
            ' '
        );
        // translator: The date is in locale of user's preference. It's used for folder name and translating the beginning of the string is enough.
        const restoreFolderName = forASV
            ? c('Info').t`Automated Recovery ${formattedDate}`
            : c('Info').t`Restored files ${formattedDate}`;
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
                AddressKeyID: addressKeyID,
            })
        );
    };

    const restoreVolumes = async (
        abortSignal: AbortSignal,
        autoRestore?: { preloadedLockedShares: LockedShares; preloadedAddressesKeys: AddressesKeysResult }
    ) => {
        const defaultShare = await getDefaultShare(abortSignal);
        const lockedVolumesForRestore = await prepareVolumesForRestore(abortSignal, autoRestore);
        if (!defaultShare || !lockedVolumesForRestore.length) {
            return false;
        }

        const [privateKey, hashKey, { privateKey: addressKey, address, addressKeyID }] = await Promise.all([
            getLinkPrivateKey(abortSignal, defaultShare.shareId, defaultShare.rootLinkId),
            getLinkHashKey(abortSignal, defaultShare.shareId, defaultShare.rootLinkId),
            getOwnAddressAndPrimaryKeys(defaultShare.addressId),
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
                lockedVolume.photos,
                addressKeyID,
                !!autoRestore
            );
            removeShares([
                lockedVolume.defaultShare.shareId,
                ...lockedVolume.devices.map(({ shareId }) => shareId),
                ...lockedVolume.photos.map(({ shareId }) => shareId),
            ]);
        });
        await preventLeave(Promise.all(restorePromiseList));

        if (!autoRestore) {
            setLockedVolumesForRestore([]);
        }

        return true;
    };

    const deleteLockedVolumes = async () => {
        const lockedShares = getLockedShares();

        const lockedVolumeIds = lockedShares.map(({ defaultShare: { volumeId } }) => volumeId);
        await preventLeave(
            Promise.all(lockedVolumeIds.map((volumeId) => debouncedRequest(queryDeleteLockedVolumes(volumeId))))
        );

        const lockedShareIds = lockedShares.map(({ defaultShare: { shareId } }) => shareId);
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
