import { useEffect, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';

import { RefuseOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/RefuseOutgoingEmergencyContactModal';
import { RevokeOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/RevokeOutgoingEmergencyContactModal';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { RefuseAccessActionPayload, RevokeAccessActionPayload } from '../interface';

export const ResetAction = () => {
    const { subscribe } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();
    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] = useState<
        RefuseAccessActionPayload | RevokeAccessActionPayload | null
    >(null);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'refuse-access' || payload.type === 'revoke-access') {
                setTmpOutgoingDelegatedAccess(payload);
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpOutgoingDelegatedAccess && tmpOutgoingDelegatedAccess.type === 'revoke-access' && (
                <RevokeOutgoingEmergencyContactModal
                    value={tmpOutgoingDelegatedAccess.value}
                    {...modal}
                    onExit={() => {
                        modal.onExit();
                        setTmpOutgoingDelegatedAccess(null);
                    }}
                />
            )}
            {renderModal && tmpOutgoingDelegatedAccess && tmpOutgoingDelegatedAccess.type === 'refuse-access' && (
                <RefuseOutgoingEmergencyContactModal
                    value={tmpOutgoingDelegatedAccess.value}
                    {...modal}
                    onExit={() => {
                        modal.onExit();
                        setTmpOutgoingDelegatedAccess(null);
                    }}
                />
            )}
        </>
    );
};
