import { useEffect, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';

import { DeleteIncomingEmergencyContactModal } from '../../../emergencyContact/incoming/modals/DeleteIncomingEmergencyContactModal';
import { DeleteIncomingRecoveryContactModal } from '../../../recoveryContact/incoming/modals/DeleteIncomingRecoveryContactModal';
import { useIncomingController } from '../../IncomingDelegatedAccessProvider';
import type { EnrichedIncomingDelegatedAccess } from '../interface';

export const DeleteAction = () => {
    const [modal, setOpen, renderModal] = useModalState();
    const { subscribe } = useIncomingController();
    const [type, setType] = useState<'recovery' | 'emergency' | null>(null);

    const [tmpIncomingDelegatedAccess, setTmpIncomingDelegatedAccess] =
        useState<EnrichedIncomingDelegatedAccess | null>(null);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'delete-emergency-contact') {
                setOpen(true);
                setType('emergency');
                setTmpIncomingDelegatedAccess(payload.value);
            }
            if (payload.type === 'delete-recovery-contact') {
                setOpen(true);
                setType('recovery');
                setTmpIncomingDelegatedAccess(payload.value);
            }
        });
    }, []);

    return (
        <>
            {renderModal &&
                tmpIncomingDelegatedAccess &&
                tmpIncomingDelegatedAccess.parsedIncomingDelegatedAccess.isEmergencyContact &&
                type === 'emergency' && (
                    <DeleteIncomingEmergencyContactModal
                        {...modal}
                        value={tmpIncomingDelegatedAccess}
                        onExit={() => {
                            modal.onExit();
                            setType(null);
                            setTmpIncomingDelegatedAccess(null);
                        }}
                    />
                )}
            {renderModal &&
                tmpIncomingDelegatedAccess &&
                tmpIncomingDelegatedAccess.parsedIncomingDelegatedAccess.isRecoveryContact &&
                type === 'recovery' && (
                    <DeleteIncomingRecoveryContactModal
                        {...modal}
                        value={tmpIncomingDelegatedAccess}
                        onExit={() => {
                            modal.onExit();
                            setType(null);
                            setTmpIncomingDelegatedAccess(null);
                        }}
                    />
                )}
        </>
    );
};
