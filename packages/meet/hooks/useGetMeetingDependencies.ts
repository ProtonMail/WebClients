import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { getActiveAddresses } from '@proton/shared/lib/helpers/address';

export const useGetMeetingDependencies = () => {
    const getAddresses = useGetAddresses();
    const getUserKeys = useGetUserKeys();

    const getMeetingDependencies = async () => {
        const addresses = await getAddresses();

        const activeAddresses = getActiveAddresses(addresses || []);

        const userKeys = await getUserKeys();

        const privateKey = userKeys[0].privateKey;

        const addressId = activeAddresses[0]?.ID;

        return { privateKey, addressId, userKeys };
    };

    return getMeetingDependencies;
};
