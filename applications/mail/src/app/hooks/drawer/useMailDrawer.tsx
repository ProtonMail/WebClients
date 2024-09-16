import {
    CalendarDrawerAppButton,
    ContactDrawerAppButton,
    SecurityCenterDrawerAppButton,
    WalletDrawerAppButton,
} from '@proton/components';
import { useDrawer } from '@proton/components/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

const useMailDrawer = () => {
    const { appInView, showDrawerSidebar } = useDrawer();

    // TODO: add UserSettings."WalletAccess" condition once available
    const canShowWalletRightSidebarLink = useFlag('WalletRightSidebarLink');

    const drawerSidebarButtons = [
        <ContactDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.CONTACTS, appInView)} />,
        <CalendarDrawerAppButton aria-expanded={isAppInView(APPS.PROTONCALENDAR, appInView)} />,
        canShowWalletRightSidebarLink && !isElectronApp && <WalletDrawerAppButton />,
        <SecurityCenterDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.SECURITY_CENTER, appInView)} />,
    ].filter(isTruthy);

    return { drawerSidebarButtons, showDrawerSidebar };
};

export default useMailDrawer;
