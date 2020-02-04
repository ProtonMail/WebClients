import { useGetAddressKeys, useGetAddresses, useApi, useCache, useNotifications } from 'react-components';
import { generateDriveBootstrap, generateNodeHashKey } from 'proton-shared/lib/keys/driveKeys';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { getActiveAddresses } from 'proton-shared/lib/helpers/address';
import { decryptPrivateKey, decryptMessage, getMessage } from 'pmcrypto';
import { useCallback } from 'react';
import { c } from 'ttag';
import { getPromiseValue } from 'react-components/hooks/useCachedModelResult';
import { queryCreateDriveVolume } from '../api/volume';
import { queryUserShares, queryShareBootstrap } from '../api/share';
import { UserShare, ShareBootstrap } from '../interfaces/share';
import { CreatedDriveVolume } from '../interfaces/volume';

function useDrive() {
    const api = useApi();
    const { createNotification } = useNotifications();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    const cache = useCache();

    const getUserShares = useCallback(
        (): Promise<UserShare[]> =>
            getPromiseValue(cache, `drive/shares`, async () => {
                const { Shares } = await api(queryUserShares());
                return Shares;
            }),
        []
    );

    const getShareBootstrap = useCallback(
        (shareId: string): Promise<{ Share: ShareBootstrap; privateKey: any }> => {
            return getPromiseValue(cache, `drive/shares/${shareId}`, async () => {
                const Share: ShareBootstrap = await api(queryShareBootstrap(shareId));
                const { privateKeys, publicKeys } = splitKeys(await getAddressKeys(Share.AddressID));

                const { data: decryptedSharePassphrase } = await decryptMessage({
                    message: await getMessage(Share.Passphrase),
                    privateKeys,
                    publicKeys
                });

                const shareKey = await decryptPrivateKey(Share.Key, decryptedSharePassphrase as string);
                return { Share, privateKey: shareKey };
            });
        },
        [api, cache, getAddressKeys]
    );

    const createVolume = useCallback(async (): Promise<CreatedDriveVolume> => {
        const addresses = await getAddresses();
        const [activeAddress] = getActiveAddresses(addresses);

        if (!activeAddress) {
            createNotification({ text: c('Error').t`No valid address found`, type: 'error' });
            throw new Error('User has no active address');
        }

        const AddressID = activeAddress.ID;
        const [{ privateKey }] = await getAddressKeys(AddressID);
        const { bootstrap, sharePrivateKey } = await generateDriveBootstrap(privateKey);
        const { NodeHashKey: FolderHashKey } = await generateNodeHashKey(sharePrivateKey);

        const { Volume } = await api(
            queryCreateDriveVolume({
                AddressID,
                VolumeName: 'MainVolume',
                ShareName: 'MainShare',
                FolderHashKey,
                VolumeMaxSpace: 1000000, // TODO: this will be controlled dynamically
                ...bootstrap
            })
        );

        cache.delete('drive/shares');

        return Volume;
    }, []);

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
