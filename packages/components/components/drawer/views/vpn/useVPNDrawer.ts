import { useOrganization } from '@proton/account/organization/hooks';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import useConfig from '@proton/components/hooks/useConfig';
import { getIsB2BAudienceFromPlan } from '@proton/payments';
import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

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
