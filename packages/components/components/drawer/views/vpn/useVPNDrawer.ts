import { useOrganization } from '@proton/account/organization/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { getIsB2BAudienceFromPlan } from '@proton/payments/core/plan/helpers';
import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import useAllowedProducts from '../../../../containers/organization/accessControl/useAllowedProducts';

// This hook returns if the VPN dashboard is available in the drawer or not
const useVPNDrawer = () => {
    const [allowedProducts, allowedProductsLoading] = useAllowedProducts();
    const { APP_NAME } = useConfig();
    const featureFlag = useFlag('VPNDrawer');
    // Organization is available for all users, which is not the case for subscription
    const [organization, organizationLoading] = useOrganization();
    const isB2C = organizationLoading ? false : getIsB2BAudienceFromPlan(organization?.PlanName) === false;
    const isMailApp = APP_NAME === APPS.PROTONMAIL;
    const isVPNEnabled = allowedProductsLoading ? false : allowedProducts?.has(Product.VPN);

    return featureFlag && isVPNEnabled && isB2C && isMailApp;
};

export default useVPNDrawer;
