import { useCallback, useEffect, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';

import { DeleteOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/DeleteOutgoingEmergencyContactModal';
import { DeleteOutgoingRecoveryContactModal } from '../../../recoveryContact/outgoing/modals/DeleteOutgoingRecoveryContactModal';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { EnrichedOutgoingDelegatedAccess } from '../interface';

export const DeleteAction = () => {
    const [modal, setOpen, renderModal] = useModalState();
    const { subscribe } = useOutgoingController();
    const [type, setType] = useState<'recovery' | 'emergency' | null>(null);

    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] =
        useState<EnrichedOutgoingDelegatedAccess | null>(null);

    const confirm = useCallback((outgoingDelegatedAccess: EnrichedOutgoingDelegatedAccess) => {
        setTmpOutgoingDelegatedAccess(outgoingDelegatedAccess);
        setOpen(true);
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'delete-emergency-contact') {
                setType('emergency');
                confirm(payload.value);
            }
            if (payload.type === 'delete-recovery-contact') {
                setType('recovery');
                confirm(payload.value);
            }
        });
    }, []);

    return (
        <>
            {renderModal &&
                tmpOutgoingDelegatedAccess &&
                tmpOutgoingDelegatedAccess.parsedOutgoingDelegatedAccess.isEmergencyContact &&
                type === 'emergency' && (
                    <DeleteOutgoingEmergencyContactModal
                        {...modal}
                        value={tmpOutgoingDelegatedAccess}
                        onExit={() => {
                            modal.onExit();
                            setType(null);
                            setTmpOutgoingDelegatedAccess(null);
                        }}
                    />
                )}
            {renderModal &&
                tmpOutgoingDelegatedAccess &&
                tmpOutgoingDelegatedAccess.parsedOutgoingDelegatedAccess.isRecoveryContact &&
                type === 'recovery' && (
                    <DeleteOutgoingRecoveryContactModal
                        {...modal}
                        value={tmpOutgoingDelegatedAccess}
                        onExit={() => {
                            modal.onExit();
                            setType(null);
                            setTmpOutgoingDelegatedAccess(null);
                        }}
                    />
                )}
        </>
    );
};
