import { CalendarDrawerAppButton, ContactDrawerAppButton } from '@proton/components/components';
import { useDrawer } from '@proton/components/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

const useMailDrawer = () => {
    const { appInView, showDrawerSidebar } = useDrawer();

    const drawerSidebarButtons = [
        <ContactDrawerAppButton aria-expanded={isAppInView(DRAWER_NATIVE_APPS.CONTACTS, appInView)} />,
        <CalendarDrawerAppButton aria-expanded={isAppInView(APPS.PROTONCALENDAR, appInView)} />,
    ];

    return { drawerSidebarButtons, showDrawerSidebar };
};

export default useMailDrawer;
