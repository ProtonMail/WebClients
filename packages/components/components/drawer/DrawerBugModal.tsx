import { useEffect } from 'react';

import { getIsDrawerPostMessage } from '@proton/shared/lib/drawer/helpers';
import type { BugModalPrefill } from '@proton/shared/lib/drawer/interfaces';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';

import AuthenticatedBugModal from '../../containers/support/AuthenticatedBugModal';
import useConfig from '../../hooks/useConfig';
import { useModalStateWithData } from '../modalTwo/useModalState';

/**
 * Hosts the "Report a problem" modal for native drawer tabs, which render in this window and so cannot
 * mount an app-shell modal themselves. Same postMessage seam {@link DrawerContactModals} uses.
 */
const DrawerBugModal = () => {
    const { APP_NAME } = useConfig();
    const [bugModal, openBugModal, renderBugModal] = useModalStateWithData<BugModalPrefill>();

    useEffect(() => {
        const handleReceived = (event: MessageEvent) => {
            // The origin check alone also admits the Calendar drawer iframe; only the native tabs
            // sharing this window are intended senders.
            if (!getIsDrawerPostMessage(event) || event.source !== window) {
                return;
            }

            switch (event.data.type) {
                case DRAWER_EVENTS.OPEN_BUG_MODAL:
                    openBugModal(event.data.payload ?? {});
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('message', handleReceived);

        return () => {
            window.removeEventListener('message', handleReceived);
        };
    }, [openBugModal]);

    if (!renderBugModal) {
        return null;
    }

    return (
        <AuthenticatedBugModal
            // BugModal seeds the form in a lazy useState, so a payload arriving while it is still
            // rendered needs a remount to take effect.
            key={`${bugModal.data?.category ?? ''}|${bugModal.data?.description ?? ''}`}
            open={bugModal.open}
            onClose={bugModal.onClose}
            onExit={bugModal.onExit}
            app={APP_NAME}
            initialDescription={bugModal.data?.description}
            initialCategory={bugModal.data?.category}
        />
    );
};

export default DrawerBugModal;
