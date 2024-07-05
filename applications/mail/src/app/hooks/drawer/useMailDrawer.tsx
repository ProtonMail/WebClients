import {
    CalendarDrawerAppButton,
    ContactDrawerAppButton,
    SecurityCenterDrawerAppButton,
    WalletDrawerAppButton,
} from '@proton/components/components';
import { useFlag } from '@proton/components/containers';
import { useDrawer, useOrganization, useUser } from '@proton/components/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import isTruthy from '@proton/utils/isTruthy';

const useMailDrawer = () => {
    const { appInView, showDrawerSidebar } = useDrawer();
    const [user] = useUser();
    const [organization] = useOrganization();
    // TODO: add UserSettings."WalletAccess" condition once available
    const canAccessWallet = useFlag('Wallet') && (user.isFree || organization?.MaxMembers === 1);

    const drawerSidebarButtons = [
        <ContactDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.CONTACTS, appInView)} />,
        <CalendarDrawerAppButton aria-expanded={isAppInView(APPS.PROTONCALENDAR, appInView)} />,
        canAccessWallet && <WalletDrawerAppButton />,
        <SecurityCenterDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.SECURITY_CENTER, appInView)} />,
    ].filter(isTruthy);

    return { drawerSidebarButtons, showDrawerSidebar };
};

export default useMailDrawer;
