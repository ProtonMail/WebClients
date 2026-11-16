import { useEffect, useState } from 'react';

import { useOutgoingController } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import type { EnrichedOutgoingDelegatedAccess } from '@proton/account/delegatedAccess/shared/outgoing/interface';
import useModalState from '@proton/components/components/modalTwo/useModalState';

import { ViewOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/ViewOutgoingEmergencyContactModal';

export const ViewAction = () => {
    const {
        subscribe,
        outgoingDelegatedAccess: { hasKeysToReactivate },
    } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();
    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] =
        useState<EnrichedOutgoingDelegatedAccess | null>(null);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'view-access') {
                setTmpOutgoingDelegatedAccess(payload.value);
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpOutgoingDelegatedAccess && (
                <ViewOutgoingEmergencyContactModal
                    {...modal}
                    hasKeysToReactivate={hasKeysToReactivate}
                    value={tmpOutgoingDelegatedAccess}
                    onExit={() => {
                        modal.onExit();
                        setTmpOutgoingDelegatedAccess(null);
                    }}
                />
            )}
        </>
    );
};
