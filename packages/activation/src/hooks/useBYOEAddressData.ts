import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useApi, useNotifications } from '@proton/components';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { type ClaimableAddress, getClaimableAddress } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

type AddressData = {
    domains: string[];
    claimableAddress: ClaimableAddress | undefined;
};
const useBYOEAddressData = (): [AddressData | undefined, boolean] => {
    const api = useApi();
    const silentApi = getSilentApi(api);
    const { createNotification } = useNotifications();

    const [addresses = []] = useAddresses();
    const [user] = useUser();

    const [loadingAddressData, setLoadingAddressData] = useState(true);
    const [addressData, setAddressData] = useState<AddressData>();

    const externalEmailAddress = addresses.find((address) => address.Type === ADDRESS_TYPE.TYPE_EXTERNAL);

    const getAddressData = async () => {
        let domains: string[] | undefined = [];

        try {
            const response = await silentApi<{ Domains: string[] }>(queryAvailableDomains());
            domains = response.Domains;
        } catch (e) {
            createNotification({
                type: 'error',
                text: c('loc_nightly: BYOE').t`Something went wrong while fetching available domains`,
            });

            setLoadingAddressData(false);
            return {
                domains: [],
                claimableAddress: undefined,
            };
        }

        const claimableAddress = await getClaimableAddress({
            user,
            api: silentApi,
            email: externalEmailAddress?.Email,
            domains,
        }).catch(noop);

        setLoadingAddressData(false);

        return {
            domains,
            claimableAddress,
        };
    };

    useEffect(() => {
        getAddressData().then((res) => {
            setAddressData(res);
        });
    }, []);

    return [addressData, loadingAddressData];
};

export default useBYOEAddressData;
