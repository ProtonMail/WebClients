import {
    CalendarDrawerAppButton,
    ContactDrawerAppButton,
    SecurityCenterDrawerAppButton,
    WalletDrawerAppButton,
    useDrawer,
} from '@proton/components';
import useDisplayFeatureTourDrawerButton from '@proton/components/components/featureTour/useDisplayFeatureTourDrawerButton';
import useAllowedProducts from '@proton/components/containers/organization/accessControl/useAllowedProducts';
import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS } from '@proton/shared/lib/constants';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import FeatureTourDrawerButton from 'proton-mail/components/drawer/FeatureTourDrawerButton';

const useMailDrawer = () => {
    const { appInView, showDrawerSidebar } = useDrawer();
    const canShowFeatureTourDrawerButton = useDisplayFeatureTourDrawerButton();

    // TODO: add UserSettings."WalletAccess" condition once available
    const canShowWalletRightSidebarLink = useFlag('WalletRightSidebarLink');

    const [allowedProducts, loadingAllowedProducts] = useAllowedProducts();

    const drawerSidebarButtons = [
        <ContactDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.CONTACTS, appInView)} />,
        allowedProducts.has(Product.Calendar) && (
            <CalendarDrawerAppButton
                aria-expanded={isAppInView(APPS.PROTONCALENDAR, appInView)}
                disabled={loadingAllowedProducts}
            />
        ),
        canShowWalletRightSidebarLink && !isElectronApp && <WalletDrawerAppButton />,
        <SecurityCenterDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.SECURITY_CENTER, appInView)} />,
        canShowFeatureTourDrawerButton && <FeatureTourDrawerButton />,
    ].filter(isTruthy);

    return { drawerSidebarButtons, showDrawerSidebar };
};

export default useMailDrawer;
