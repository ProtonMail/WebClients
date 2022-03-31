import { format } from 'date-fns';
import { useCallback } from 'react';

import { usePreventLeave, useAddressesKeys } from '@proton/components';
import { Address } from '@proton/shared/lib/interfaces';
import { dateLocale } from '@proton/shared/lib/i18n';
import isTruthy from '@proton/utils/isTruthy';
import { generateLookupHash, encryptPassphrase } from '@proton/shared/lib/keys/driveKeys';
import { queryRestoreDriveVolume, queryDeleteLockedVolumes } from '@proton/shared/lib/api/drive/volume';
import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';

import { useDebouncedFunction } from '../../_utils';
import { useDebouncedRequest } from '../../_api';
import { useDriveCrypto } from '../../_crypto';
import { useLink } from '../../_links';
import { GLOBAL_FORBIDDEN_CHARACTERS } from '../../_links/link';
import useShare from './../useShare';
import useDefaultShare from './../useDefaultShare';
import useSharesState from './../useSharesState';
import { ShareWithKey, LockedVolumeForRestore } from './../interface';
import { getPossibleAddressPrivateKeys, prepareVolumeForRestore } from './utils';

/**
 * useLockedVolume provides actions to delete or recover files from locked volumes.
 */
export default function useLockedVolume() {
    const { getLinkPrivateKey, getLinkHashKey } = useLink();

    return useLockedVolumeInner({
        sharesState: useSharesState(),
        getShareWithKey: useShare().getShareWithKey,
        getDefaultShare: useDefaultShare().getDefaultShare,
        addressesKeys: useAddressesKeys()[0],
        getPrimaryAddressKey: useDriveCrypto().getPrimaryAddressKey,
        prepareVolumeForRestore,
        getLinkHashKey,
        getLinkPrivateKey,
    });
}

type LockedVolumesCallbacks = {
    sharesState: ReturnType<typeof useSharesState>;
    getShareWithKey: ReturnType<typeof useShare>['getShareWithKey'];
    addressesKeys: ReturnType<typeof useAddressesKeys>[0];
    getDefaultShare: ReturnType<typeof useDefaultShare>['getDefaultShare'];
    getPrimaryAddressKey: ReturnType<typeof useDriveCrypto>['getPrimaryAddressKey'];
    prepareVolumeForRestore: typeof prepareVolumeForRestore;
    getLinkPrivateKey: ReturnType<typeof useLink>['getLinkPrivateKey'];
    getLinkHashKey: ReturnType<typeof useLink>['getLinkHashKey'];
};

export function useLockedVolumeInner({
    getShareWithKey,
    sharesState,
    addressesKeys,
    getDefaultShare,
    getPrimaryAddressKey,
    prepareVolumeForRestore,
    getLinkPrivateKey,
    getLinkHashKey,
}: LockedVolumesCallbacks) {
    const { preventLeave } = usePreventLeave();
    const debouncedFunction = useDebouncedFunction();
    const debouncedRequest = useDebouncedRequest();

    const getLoadedLockedShares = useCallback(
        async (abortSignal: AbortSignal) => {
            return Promise.all(
                sharesState.getLockedShares().map(({ shareId }) => getShareWithKey(abortSignal, shareId))
            );
        },
        [sharesState.getLockedShares]
    );
    const getLockedUnpreparedShares = useCallback(
        async (lockedShares: ShareWithKey[]) => {
            return lockedShares.filter(
                ({ shareId }) =>
                    !sharesState.lockedVolumesForRestore.some(
                        ({ shareId: preparedShareId }) => shareId === preparedShareId
                    )
            );
        },
        [sharesState.lockedVolumesForRestore]
    );

    const getPreparedVolumes = useCallback(
        async (lockedUnpreparedShares: ShareWithKey[], addressPrivateKeys: PrivateKeyReference[]) => {
            const preparedVolumes = await Promise.all(
                lockedUnpreparedShares.map((share) => {
                    return debouncedFunction(
                        async () => prepareVolumeForRestore(share, addressPrivateKeys),
                        ['prepareVolumeForRestore', share.shareId]
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

        const [Hash, { NodePassphrase, NodePassphraseSignature }, { message: encryptedName }] = await Promise.all([
            generateLookupHash(restoreFolderName, hashKey),
            encryptPassphrase(privateKey, addressKey, lockedSharePassphraseRaw),
            CryptoProxy.encryptMessage({
                textData: restoreFolderName,
                stripTrailingSpaces: true,
                encryptionKeys: privateKey,
                signingKeys: addressKey,
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

    const restoreVolumes = async (abortSignal: AbortSignal) => {
        const defaultShare = await getDefaultShare(abortSignal);
        const lockedVolumesForRestore = await prepareVolumesForRestore(abortSignal);
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
        const restorePromiseList = [lockedVolumesForRestore[0]].map(
            async ({ shareId, lockedVolumeId, decryptedPassphrase }) => {
                await restoreVolume(
                    defaultShare.volumeId,
                    privateKey,
                    hashKey,
                    addressKey,
                    address,
                    lockedVolumeId,
                    decryptedPassphrase
                );
                sharesState.removeShares([shareId]);
            }
        );
        await preventLeave(Promise.all(restorePromiseList));

        sharesState.setLockedVolumesForRestore([]);
    };

    const deleteLockedVolumes = async () => {
        const lockedShares = sharesState.getLockedShares();

        const lockedVolumeIds = lockedShares.map(({ volumeId }) => volumeId);
        await preventLeave(
            Promise.all(lockedVolumeIds.map((volumeId) => debouncedRequest(queryDeleteLockedVolumes(volumeId))))
        );

        const lockedShareIds = lockedShares.map(({ shareId }) => shareId);
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
