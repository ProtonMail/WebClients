import { useRef } from 'react';

import { CalendarDrawerAppButton, ContactDrawerAppButton } from '@proton/components/components';
import { useDrawer } from '@proton/components/hooks';
import { APPS } from '@proton/shared/lib/constants';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

const useMailDrawer = () => {
    const { appInView } = useDrawer();
    const drawerSpotlightSeenRef = useRef(false);

    const markSpotlightAsSeen = () => {
        if (drawerSpotlightSeenRef) {
            drawerSpotlightSeenRef.current = true;
        }
    };

    const drawerSidebarButtons = [
        <ContactDrawerAppButton
            onClick={markSpotlightAsSeen}
            aria-expanded={isAppInView(DRAWER_NATIVE_APPS.CONTACTS, appInView)}
        />,
        <CalendarDrawerAppButton
            onClick={markSpotlightAsSeen}
            aria-expanded={isAppInView(APPS.PROTONCALENDAR, appInView)}
        />,
    ];

    return { drawerSidebarButtons, drawerSpotlightSeenRef };
};

export default useMailDrawer;
