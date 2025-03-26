import { useSubscription } from '@proton/account/subscription/hooks';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import useConfig from '@proton/components/hooks/useConfig';
import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS } from '@proton/shared/lib/constants';
import { getIsB2BAudienceFromSubscription } from '@proton/shared/lib/helpers/subscription';
import useFlag from '@proton/unleash/useFlag';

// This hook returns if the VPN dashboard is available in the drawer or not
const useVPNDrawer = () => {
    const [allowedProducts] = useAllowedProducts();
    const { APP_NAME } = useConfig();
    const featureFlag = useFlag('VPNDrawer');
    const [subscription] = useSubscription();
    const isB2C = getIsB2BAudienceFromSubscription(subscription) === false;
    const isMailApp = APP_NAME === APPS.PROTONMAIL;
    const isVPNEnabled = allowedProducts?.has(Product.VPN);

    return featureFlag && isVPNEnabled && isB2C && isMailApp;
};

export default useVPNDrawer;
