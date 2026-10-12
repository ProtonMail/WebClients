import { useGetAddresses } from '@proton/account/addresses/hooks';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';

/**
 * Returns a stable getter telling whether an account email is a BYOE address of the user.
 * Does not subscribe the component to address updates. Resolves to `false` when addresses can't be loaded.
 */
export const useGetIsBYOE = () => {
    const getAddresses = useGetAddresses();

    return async (account: string) => {
        try {
            const addresses = await getAddresses();
            const normalized = account.toLowerCase();
            const address = addresses.find(({ Email }) => Email.toLowerCase() === normalized);
            return !!address && getIsBYOEAddress(address);
        } catch {
            return false;
        }
    };
};
