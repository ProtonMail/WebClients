import useCachedAsyncResult from './useCachedAsyncResult';
import useGetKeys from './useGetKeys';

const useAddressesKeys = (User, Addresses) => {
    const getKeysByID = useGetKeys();
    return useCachedAsyncResult(
        'ADDRESSES_KEYS',
        async () => {
            const addresses = Addresses || [];
            const keys = await Promise.all(
                addresses.map((Address) => {
                    return getKeysByID(Address.ID, Address.Keys, User.OrganizationPrivateKey);
                })
            );
            return addresses.reduce((acc, { ID }, i) => {
                return {
                    ...acc,
                    [ID]: keys[i]
                };
            }, {});
        },
        [Addresses]
    );
};

export default useAddressesKeys;
