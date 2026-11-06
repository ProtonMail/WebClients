import { Product } from '@proton/shared/lib/ProductEnum';
import { USER_ROLES } from '@proton/shared/lib/constants';
import { deserializeAllowedProducts } from '@proton/shared/lib/organization/accessControl/serialization';

import { useUser } from '../user/hooks';
import { useOrganization } from './hooks';

/**
 * Check if user has access to Meet product
 */
export const useHasMeetProductAccess = (): boolean => {
    const [user] = useUser();
    const [organization, loadingOrganization] = useOrganization();
    const allowedProducts = deserializeAllowedProducts(organization?.Settings?.AllowedProducts);

    // Admins can always access meet
    if (user && user.Role === USER_ROLES.ADMIN_ROLE) {
        return true;
    }

    // Otherwise, check if meet is allowed for the organization
    const isMeetEnabled = !loadingOrganization && allowedProducts.has(Product.Meet);

    return isMeetEnabled;
};
