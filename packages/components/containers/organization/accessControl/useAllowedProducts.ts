import { useOrganization } from '@proton/account/organization/hooks';
import type {
    OrganizationSettingsAllowedProduct,
    OrganizationSettingsAllowedProducts,
} from '@proton/shared/lib/interfaces';

import getAccessControlApplications from './getAccessControlApplications';
import type { AccessControlApplication } from './types';

const getAllowedProductsSet = (
    applications: AccessControlApplication[],
    allowedProducts: OrganizationSettingsAllowedProducts = ['All']
): Set<OrganizationSettingsAllowedProduct> => {
    const value = new Set(allowedProducts);
    if (value.has('All')) {
        return new Set(applications.map((application) => application.product));
    }
    return value;
};

/**
 * Returns a set of the allowed applications configured by the org admin in the AccessControl page
 */
const useAllowedProducts = () => {
    const [organization, loadingOrganization] = useOrganization();
    const applications = getAccessControlApplications();

    const allowedProducts = getAllowedProductsSet(applications, organization?.Settings?.AllowedProducts);

    const loading = loadingOrganization;

    return [allowedProducts, loading] as const;
};

export default useAllowedProducts;
