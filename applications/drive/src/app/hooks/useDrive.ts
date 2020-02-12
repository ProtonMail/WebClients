import { useGetAddressKeys, useApi } from 'react-components';
import { generateDriveBootstrap, generateNodeHashKey } from 'proton-shared/lib/keys/driveKeys';
import { decryptPassphrase } from 'proton-shared/lib/keys/calendarKeys';
import { decryptPrivateKey } from 'pmcrypto';
import { useCallback } from 'react';
import { queryCreateDriveVolume } from '../api/volume';
import { queryUserShares, queryShareBootstrap } from '../api/share';
import { UserShareResult, ShareBootstrap } from '../interfaces/share';
import { CreatedDriveVolumeResult } from '../interfaces/volume';
import useDriveCrypto from './useDriveCrypto';
import useCachedResponse from './useCachedResponse';

function useDrive() {
    const api = useApi();
    const { cache, getCachedResponse } = useCachedResponse();
    const { getPrimaryAddressKey, getVerificationKeys } = useDriveCrypto();
    const getAddressKeys = useGetAddressKeys();

    const getUserShares = useCallback(
        () =>
            getCachedResponse(`drive/shares`, async () => {
                const { Shares } = await api<UserShareResult>(queryUserShares());
                return Shares;
            }),
        []
    );

    const getShareBootstrap = useCallback(
        (shareId: string) => {
            return getCachedResponse(`drive/shares/${shareId}`, async () => {
                const Share: ShareBootstrap = await api(queryShareBootstrap(shareId));

                const { privateKeys, publicKeys } = await getVerificationKeys(Share.AddressID);
                const decryptedSharePassphrase = await decryptPassphrase({
                    armoredPassphrase: Share.Passphrase,
                    armoredSignature: Share.PassphraseSignature,
                    privateKeys,
                    publicKeys
                });

                const shareKey = await decryptPrivateKey(Share.Key, decryptedSharePassphrase as string);
                return { Share, privateKey: shareKey };
            });
        },
        [api, getAddressKeys]
    );

    const createVolume = useCallback(async () => {
        const { address, privateKey } = await getPrimaryAddressKey();
        const { bootstrap, sharePrivateKey } = await generateDriveBootstrap(privateKey);
        const { NodeHashKey: FolderHashKey } = await generateNodeHashKey(sharePrivateKey);

        const { Volume } = await api<CreatedDriveVolumeResult>(
            queryCreateDriveVolume({
                AddressID: address.ID,
                VolumeName: 'MainVolume',
                ShareName: 'MainShare',
                FolderHashKey,
                VolumeMaxSpace: 1000000, // TODO: this will be controlled dynamically
                ...bootstrap
            })
        );

        cache.delete('drive/shares');

        return Volume;
    }, [cache]);

    /**
     * Loads drive and gets the active share bootstrap.
     * If undefined is returned, assume drive is not initialized,
     * and drive volume needs to be created before proceeding.
     */
    const loadDrive = useCallback(async () => {
        const userShares = await getUserShares();

        if (!userShares.length) {
            return undefined;
        }

        const [{ ShareID }] = userShares; // Currently, always only one share exists
        return getShareBootstrap(ShareID);
    }, []);

    return { createVolume, getUserShares, getShareBootstrap, loadDrive };
}

export default useDrive;
