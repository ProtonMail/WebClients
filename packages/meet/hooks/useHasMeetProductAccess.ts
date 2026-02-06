import { useUser } from '@proton/account/user/hooks';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import { Product } from '@proton/shared/lib/ProductEnum';
import { USER_ROLES } from '@proton/shared/lib/constants';

/**
 * Check if user has access to Meet product
 */
export const useHasMeetProductAccess = (): boolean => {
    const [user] = useUser();
    const [allowedProducts, loadingAllowedProducts] = useAllowedProducts();

    // Admins can always access meet
    if (user && user.Role === USER_ROLES.ADMIN_ROLE) {
        return true;
    }

    // Otherwise, check if meet is allowed for the organization
    const isMeetEnabled = !loadingAllowedProducts && allowedProducts.has(Product.Meet);

    return isMeetEnabled;
};
