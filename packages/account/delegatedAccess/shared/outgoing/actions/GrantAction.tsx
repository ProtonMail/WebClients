import { useEffect, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';

import { GrantOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/GrantOutgoingEmergencyContactModal';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { EnrichedOutgoingDelegatedAccess } from '../interface';

export const GrantAction = () => {
    const { subscribe } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();
    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] =
        useState<EnrichedOutgoingDelegatedAccess | null>(null);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'grant-access') {
                setTmpOutgoingDelegatedAccess(payload.value);
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpOutgoingDelegatedAccess && (
                <GrantOutgoingEmergencyContactModal
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
