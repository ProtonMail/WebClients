import { useApi, useGetAddressKeys } from 'react-components';
import { useCallback } from 'react';
import { decryptPrivateKey } from 'pmcrypto';
import { decryptPassphrase } from 'proton-shared/lib/keys/calendarKeys';
import useCachedResponse from './useCachedResponse';
import useDriveCrypto from './useDriveCrypto';
import { queryUserShares, queryShareMeta } from '../api/share';
import { ShareMeta, UserShareResult } from '../interfaces/share';
import { queryCreateDriveVolume } from '../api/volume';
import { CreatedDriveVolumeResult } from '../interfaces/volume';
import { generateDriveBootstrap, generateNodeHashKey } from 'proton-shared/lib/keys/driveKeys';

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
        [api, getCachedResponse]
    );

    const fetchShareMeta = useCallback(
        (shareId: string) => {
            return getCachedResponse(`drive/shares/${shareId}`, async () => {
                const Share = await api<ShareMeta>(queryShareMeta(shareId));

                const { privateKeys, publicKeys } = await getVerificationKeys(Share.AddressID);
                const decryptedSharePassphrase = await decryptPassphrase({
                    armoredPassphrase: Share.Passphrase,
                    armoredSignature: Share.PassphraseSignature,
                    privateKeys,
                    publicKeys
                });

                const shareKey = await decryptPrivateKey(Share.Key, decryptedSharePassphrase);
                return {
                    Share,
                    keys: {
                        privateKey: shareKey
                    }
                };
            });
        },
        [api, getAddressKeys, getVerificationKeys, getCachedResponse]
    );

    const createVolume = useCallback(async () => {
        const { address, privateKey } = await getPrimaryAddressKey();
        const { bootstrap, folderPrivateKey } = await generateDriveBootstrap(privateKey);
        const { NodeHashKey: FolderHashKey } = await generateNodeHashKey(folderPrivateKey.toPublic());

        const { Volume } = await api<CreatedDriveVolumeResult>(
            queryCreateDriveVolume({
                AddressID: address.ID,
                VolumeName: 'MainVolume',
                ShareName: 'MainShare',
                FolderHashKey,
                VolumeMaxSpace: 1000000000, // TODO: this will be controlled dynamically
                ...bootstrap
            })
        );

        cache.delete('drive/shares');

        return Volume;
    }, [api, cache]);

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
        return fetchShareMeta(ShareID);
    }, [getUserShares, fetchShareMeta]);

    return { createVolume, getUserShares, fetchShareMeta, loadDrive };
}

export default useDrive;
