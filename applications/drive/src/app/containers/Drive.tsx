import React, { useEffect } from 'react';
import Page from '../components/page/Page';
import { useModals, useApiResult, useApi, useGetAddresses, useGetAddressKeys } from 'react-components';
import OnboardingModal from '../components/OnboardingModal/OnboardingModal';
import { queryUserShares } from '../api/share';
import { UserSharesResult } from '../interfaces/share';
import { generateDriveBootstrap } from 'proton-shared/lib/keys/driveKeys';
import { getPrimaryAddress } from 'proton-shared/lib/helpers/address';
import { queryCreateDriveVolume } from '../api/volume';

function Drive() {
    const api = useApi();
    const { createModal } = useModals();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();

    const { result } = useApiResult<UserSharesResult, typeof queryUserShares>(queryUserShares, []);

    useEffect(() => {
        // First-time user's drive initialization
        if (result && !result.Shares.length) {
            createModal(<OnboardingModal />);

            const createVolume = async () => {
                const addresses = await getAddresses();
                const primaryAddress = getPrimaryAddress(addresses);

                if (!primaryAddress) {
                    throw Error('User has primary address');
                }

                const AddressID = primaryAddress.ID;
                const [{ privateKey }] = await getAddressKeys(AddressID);
                const bootstrap = await generateDriveBootstrap(privateKey);

                api(
                    queryCreateDriveVolume({
                        AddressID,
                        VolumeName: 'MainVolume',
                        ShareName: 'MainShare',
                        FolderHashKey: 'n/a', // TODO: generate when implementing lookup
                        VolumeMaxSpace: 1000000,
                        ...bootstrap
                    })
                );
            };

            createVolume();
        }
    }, [result]);

    return <Page title="My files">Drive</Page>;
}

export default Drive;
