import { useOrganization } from '@proton/account/organization/hooks';
import { deserializeAllowedProducts } from '@proton/shared/lib/organization/accessControl/serialization';

/**
 * Returns a set of the allowed applications configured by the org admin in the AccessControl page
 */
const useAllowedProducts = () => {
    const [organization, loadingOrganization] = useOrganization();

    const allowedProducts = deserializeAllowedProducts(organization?.Settings?.AllowedProducts);

    const loading = loadingOrganization;

    return [allowedProducts, loading] as const;
};

export default useAllowedProducts;
