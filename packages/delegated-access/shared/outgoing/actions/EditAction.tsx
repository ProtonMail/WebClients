import { useEffect, useState } from 'react';

import { useOutgoingController } from '@proton/account/delegatedAccess/shared/OutgoingDelegatedAccessProvider';
import type { EnrichedOutgoingDelegatedAccess } from '@proton/account/delegatedAccess/shared/outgoing/interface';
import useModalState from '@proton/components/components/modalTwo/useModalState';

import { EditOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/EditOutgoingEmergencyContactModal';

export const EditAction = () => {
    const { subscribe } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();
    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] =
        useState<EnrichedOutgoingDelegatedAccess | null>(null);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'change-wait-time') {
                setTmpOutgoingDelegatedAccess(payload.value);
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpOutgoingDelegatedAccess && (
                <EditOutgoingEmergencyContactModal
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
