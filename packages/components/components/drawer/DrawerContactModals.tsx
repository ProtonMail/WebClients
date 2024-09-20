import { useEffect, useRef } from 'react';

import { useContactModals } from '@proton/components';
import { useDrawer } from '@proton/components/hooks/drawer';
import { getIsDrawerPostMessage, postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import type { DrawerApp } from '@proton/shared/lib/drawer/interfaces';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';

const DrawerContactModals = () => {
    const { iframeSrcMap } = useDrawer();

    const {
        modals: contactModals,
        onDetails,
        onEdit,
    } = useContactModals({
        onChange: () => {
            if (iframeSrcMap) {
                Object.keys(iframeSrcMap).map((app) => {
                    postMessageToIframe({ type: DRAWER_EVENTS.CALL_EVENT_MANAGER_FROM_OUTSIDE }, app as DrawerApp);
                });
            }
        },
    });

    /**
     * We need to store callbacks inside a ref because of the useEffect below.
     */
    const onDetailsRef = useRef(onDetails);
    const onEditRef = useRef(onEdit);

    useEffect(() => {
        onDetailsRef.current = onDetails;
        onEditRef.current = onEdit;
    });

    useEffect(() => {
        const handleReceived = async (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            switch (event.data.type) {
                case DRAWER_EVENTS.OPEN_CONTACT_MODAL:
                    if ('contactID' in event.data.payload) {
                        const { contactID } = event.data.payload;
                        onDetailsRef.current(contactID);
                    }
                    if ('vCardContact' in event.data.payload) {
                        const { vCardContact } = event.data.payload;
                        onEditRef.current({ vCardContact });
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('message', handleReceived);

        return () => {
            window.removeEventListener('message', handleReceived);
        };
    }, []);

    return contactModals;
};

export default DrawerContactModals;
