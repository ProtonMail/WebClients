import useCachedAsyncResult from './useCachedAsyncResult';
import useGetKeys from './useGetKeys';

const useUserKeys = (User) => {
    const getKeysByID = useGetKeys();
    return useCachedAsyncResult(
        'USER_KEYS',
        () => {
            return getKeysByID(User.ID, User.Keys, User.OrganizationPrivateKey);
        },
        [User]
    );
};

export default useUserKeys;
