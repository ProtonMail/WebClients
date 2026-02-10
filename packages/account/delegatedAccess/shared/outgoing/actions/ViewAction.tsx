import { useEffect, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';

import { ViewOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/ViewOutgoingEmergencyContactModal';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { EnrichedOutgoingDelegatedAccess } from '../interface';

export const ViewAction = () => {
    const { subscribe } = useOutgoingController();
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
