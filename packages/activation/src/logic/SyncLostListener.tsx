import { useEffect, useRef } from 'react';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import useConfig from '@proton/components/hooks/useConfig';
import { APPS } from '@proton/shared/lib/constants';

import { ApiSyncState } from '../api/api.interface';
import BYOESyncLostModal from '../components/Modals/BYOESyncLostModal/BYOESyncLostModal';
import type { EasySwitchState } from './store';
import { listenerMiddleware } from './store';
import { selectSync } from './sync/sync.selectors';

const SyncLostListener = () => {
    const [addresses] = useAddresses();
    const { APP_NAME } = useConfig();
    const isBYOESyncModalOpenRef = useRef(false);
    const [byoeSyncLostModal, handleShowBYOESyncLostModal] = useModalTwo(BYOESyncLostModal);

    const openSyncLostModal = (disconnectedEmails: string[]) => {
        if (APP_NAME !== APPS.PROTONMAIL || isBYOESyncModalOpenRef.current) {
            return;
        }
        void handleShowBYOESyncLostModal({
            disconnectedEmails,
            onCustomClose: () => (isBYOESyncModalOpenRef.current = false),
        });
        isBYOESyncModalOpenRef.current = true;
    };

    useEffect(() => {
        const unsubscribe = listenerMiddleware.startListening({
            predicate: (_action, currentState, previousState) => {
                const previousSyncs = Object.values(selectSync(previousState as EasySwitchState));
                const currentSyncs = Object.values(selectSync(currentState as EasySwitchState));

                // Check if a sync has been lost
                const lost = currentSyncs.filter(
                    (curr) =>
                        curr.state !== ApiSyncState.ACTIVE &&
                        previousSyncs.some((prev) => prev.id === curr.id && prev.state === ApiSyncState.ACTIVE) &&
                        addresses?.some((a) => a.Email === curr.account)
                );

                return lost.length > 0;
            },
            effect: (_action, listenerApi) => {
                // Get only the recently lost syncs, not hypothetical older lost syncs
                const currentState = listenerApi.getState() as EasySwitchState;
                const previousState = listenerApi.getOriginalState() as EasySwitchState;

                const previousSyncs = Object.values(selectSync(previousState));
                const currentSyncs = Object.values(selectSync(currentState));

                const disconnectedEmails = currentSyncs
                    .filter(
                        (curr) =>
                            curr.state !== ApiSyncState.ACTIVE &&
                            previousSyncs.some((prev) => prev.id === curr.id && prev.state === ApiSyncState.ACTIVE) &&
                            addresses?.some((a) => a.Email === curr.account)
                    )
                    .map((sync) => sync.account);

                if (disconnectedEmails.length > 0) {
                    openSyncLostModal(disconnectedEmails);
                }
            },
        });

        return unsubscribe;
    }, [addresses]);

    return byoeSyncLostModal;
};

export default SyncLostListener;
