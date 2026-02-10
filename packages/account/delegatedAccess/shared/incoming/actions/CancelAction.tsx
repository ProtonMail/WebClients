import { useEffect, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';

import { CancelIncomingEmergencyContactModal } from '../../../emergencyContact/incoming/modals/CancelIncomingEmergencyContactModal';
import { useIncomingController } from '../../IncomingDelegatedAccessProvider';
import type { EnrichedIncomingDelegatedAccess } from '../interface';

export const CancelAction = () => {
    const [modal, setOpen, renderModal] = useModalState();
    const { subscribe } = useIncomingController();

    const [tmpIncomingDelegatedAccess, setTmpIncomingDelegatedAccess] =
        useState<EnrichedIncomingDelegatedAccess | null>(null);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'cancel-request-access') {
                setOpen(true);
                setTmpIncomingDelegatedAccess(payload.value);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpIncomingDelegatedAccess && (
                <CancelIncomingEmergencyContactModal
                    {...modal}
                    value={tmpIncomingDelegatedAccess}
                    onExit={() => {
                        modal.onExit();
                        setTmpIncomingDelegatedAccess(null);
                    }}
                />
            )}
        </>
    );
};
