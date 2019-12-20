import { useGetAddressKeys, useGetAddresses, useApi, useCache } from 'react-components';
import { getPrimaryAddress } from 'proton-shared/lib/helpers/address';
import { generateDriveBootstrap, encryptUnsigned } from 'proton-shared/lib/keys/driveKeys';
import { queryCreateDriveVolume } from '../api/volume';
import { queryUserShares, queryShareBootstrap } from '../api/share';
import { getPromiseValue } from 'react-components/hooks/useCachedModelResult';
import { UserShare, ShareBootstrap } from '../interfaces/share';
import { CreatedDriveVolume } from '../interfaces/volume';
import { decryptPrivateKeyArmored, splitKeys } from 'proton-shared/lib/keys/keys';
import { decryptMessage, getMessage } from 'pmcrypto/lib/pmcrypto';
import { useCallback } from 'react';

function useDrive() {
    const api = useApi();
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

                const shareKey = await decryptPrivateKeyArmored(Share.Key, decryptedSharePassphrase);
                return { Share, privateKey: shareKey };
            });
        },
        [api, cache, getAddressKeys]
    );

    const createVolume = useCallback(async (): Promise<CreatedDriveVolume> => {
        const addresses = await getAddresses();
        const primaryAddress = getPrimaryAddress(addresses);

        if (!primaryAddress) {
            throw Error('User has no primary address');
        }

        const AddressID = primaryAddress.ID;
        const [{ privateKey }] = await getAddressKeys(AddressID);
        const bootstrap = await generateDriveBootstrap(privateKey);

        // TODO: generate a real one when implementing lookup
        const FolderHashKey = await encryptUnsigned({
            message: 'n/a',
            privateKey
        });

        const { Volume } = await api(
            queryCreateDriveVolume({
                AddressID,
                VolumeName: 'MainVolume',
                ShareName: 'MainShare',
                FolderHashKey,
                VolumeMaxSpace: 1000000,
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
