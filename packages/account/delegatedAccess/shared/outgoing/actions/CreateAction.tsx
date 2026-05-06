import { useEffect, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';

import { CreateOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/CreateOutgoingEmergencyContactModal';
import { CreateOutgoingRecoveryContactModal } from '../../../recoveryContact/outgoing/modals/CreateOutgoingRecoveryContactModal';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { AddActionPayload } from '../interface';

export const CreateAction = () => {
    const { subscribe } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();
    const [actionPayload, setActionPayload] = useState<AddActionPayload['value'] | null>(null);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'add') {
                setActionPayload(payload.value);
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && actionPayload === 'emergency-contact' && (
                <CreateOutgoingEmergencyContactModal
                    {...modal}
                    onExit={() => {
                        modal.onExit();
                        setActionPayload(null);
                    }}
                />
            )}
            {renderModal && actionPayload === 'recovery-contact' && (
                <CreateOutgoingRecoveryContactModal
                    {...modal}
                    onExit={() => {
                        modal.onExit();
                        setActionPayload(null);
                    }}
                />
            )}
        </>
    );
};
